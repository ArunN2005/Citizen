const axios = require('axios');

class XSocialSignalService {
  constructor() {
    this.bearerToken = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
    this.baseUrl = process.env.X_API_BASE_URL || 'https://api.x.com/2';
    const requestedMaxResults = parseInt(process.env.X_SEARCH_MAX_RESULTS || '10', 10);
    this.maxResults = Math.min(Math.max(requestedMaxResults, 10), 100);
    this.matchedResultsLimit = 5;
    this.lookbackHours = Math.max(parseInt(process.env.X_SEARCH_LOOKBACK_HOURS || '48', 10), 1);
    this.googleGeocodingApiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  }

  isEnabled() {
    return Boolean(this.bearerToken);
  }

  tokenize(text = '') {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'to', 'of', 'for', 'in', 'on', 'at', 'by',
      'with', 'is', 'are', 'was', 'were', 'be', 'this', 'that', 'it', 'from', 'as'
    ]);

    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9#\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stopWords.has(token));
  }

  normalizeText(value = '') {
    return String(value || '')
      .toLowerCase()
      .replace(/[_-]/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractKeywords({ title = '', description = '', category = '' }) {
    const titleTokens = this.tokenize(title);
    const descriptionTokens = this.tokenize(description);
    const categoryTokens = this.tokenize((category || '').replace(/_/g, ' '));

    const freq = new Map();
    [...titleTokens, ...titleTokens, ...descriptionTokens, ...categoryTokens].forEach((token) => {
      freq.set(token, (freq.get(token) || 0) + 1);
    });

    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([token]) => token)
      .slice(0, 10);
  }

  getExpectedLabelsForCategory(category = '') {
    const normalizedCategory = this.normalizeText(category);
    const map = {
      pothole: ['pothole', 'road damage', 'damaged road'],
      road_damage: ['road damage', 'damaged road', 'pothole'],
      sewage_overflow: ['sewage overflow', 'sewage', 'drainage overflow', 'water leakage'],
      water_issue: ['water leakage', 'water issue', 'pipe leak'],
      water_leakage: ['water leakage', 'pipe leak', 'water issue'],
      garbage: ['garbage dump', 'garbage', 'waste'],
      broken_streetlight: ['broken streetlight', 'streetlight', 'lighting issue'],
      streetlight: ['streetlight', 'broken streetlight', 'lighting issue'],
      flooding: ['flooding', 'waterlogging', 'flood'],
      traffic_signal: ['traffic signal', 'signal failure', 'traffic light'],
      public_property_damage: ['public property damage', 'damaged property', 'vandalism']
    };

    return map[normalizedCategory] || [normalizedCategory];
  }

  extractClassificationFromImageValidation(imageValidation = null) {
    const message = imageValidation?.message || '';
    const detectedMatch = message.match(/Detected Issue:\s*([^\n]+)/i);
    if (detectedMatch?.[1]) {
      return this.normalizeText(detectedMatch[1]);
    }
    return null;
  }

  getClassificationTerms(category = '', imageValidation = null) {
    const fromCategory = this.getExpectedLabelsForCategory(category)
      .map((label) => this.normalizeText(label))
      .filter(Boolean);

    const fromImage = this.extractClassificationFromImageValidation(imageValidation);
    const combined = new Set(fromCategory);
    if (fromImage) {
      combined.add(fromImage);
    }

    return [...combined].slice(0, 6);
  }

  isLikelyLocationToken(token = '') {
    if (!token || /^\d+$/.test(token)) {
      return false;
    }

    const ignored = new Set([
      'exact', 'coordinates', 'urgent', 'infrastructure', 'issue', 'street', 'level',
      'accuracy', 'general', 'complaints', 'user', 'location', 'privacy', 'unknown'
    ]);
    return !ignored.has(token);
  }

  containsAnyPhrase(text = '', phrases = []) {
    const normalizedText = this.normalizeText(text);
    return phrases.some((phrase) => normalizedText.includes(this.normalizeText(phrase)));
  }

  isCoordinateLikeText(value = '') {
    if (!value) return false;
    return /^\s*-?\d{1,3}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?\s*$/.test(String(value));
  }

  async reverseGeocodeCoordinates(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return null;
    }

    if (this.googleGeocodingApiKey) {
      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            latlng: `${latitude},${longitude}`,
            key: this.googleGeocodingApiKey
          },
          timeout: 7000
        });

        const firstResult = response.data?.results?.[0];
        if (firstResult) {
          const components = firstResult.address_components || [];
          const getComp = (types) => {
            const match = components.find((comp) => types.some((t) => comp.types?.includes(t)));
            return match?.long_name || null;
          };

          const locality = getComp(['sublocality_level_1', 'sublocality', 'neighborhood']);
          const area = getComp(['locality', 'administrative_area_level_2']);
          const city = getComp(['administrative_area_level_1', 'locality']);

          const concise = [locality, area, city].filter(Boolean).join(', ');
          return concise || firstResult.formatted_address || null;
        }
      } catch (error) {
        // Fall through to Nominatim fallback.
      }
    }

    try {
      const nominatim = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'jsonv2',
          zoom: 17,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'CivicRezo/1.0 (reverse-geocode-fallback)'
        },
        timeout: 7000
      });

      const addr = nominatim.data?.address || {};
      const concise = [
        addr.suburb || addr.neighbourhood || addr.road,
        addr.city_district || addr.city || addr.town,
        addr.state
      ].filter(Boolean).join(', ');

      return concise || nominatim.data?.display_name || null;
    } catch (error) {
      return null;
    }
  }

  async resolveLocationText(locationData = {}) {
    const rawAddress = String(locationData.address || '').trim();
    const rawDescription = String(locationData.description || '').trim();

    const addressLooksUseful = rawAddress && !this.isCoordinateLikeText(rawAddress);
    const descriptionLooksUseful = rawDescription && !rawDescription.toLowerCase().includes('street-level accuracy');

    if (addressLooksUseful || descriptionLooksUseful) {
      return `${rawAddress} ${rawDescription}`.trim();
    }

    const latitude = Number(locationData.latitude);
    const longitude = Number(locationData.longitude);
    const reverseGeocoded = await this.reverseGeocodeCoordinates(latitude, longitude);

    if (reverseGeocoded) {
      return `${reverseGeocoded} ${rawDescription}`.trim();
    }

    const coordinateFallback =
      typeof latitude === 'number' && typeof longitude === 'number'
        ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        : '';

    return `${rawAddress} ${rawDescription} ${coordinateFallback}`.trim();
  }

  hasLocationAndClassificationMatch(postText = '', locationTerms = [], classificationTerms = []) {
    const hasClassificationMatch = this.containsAnyPhrase(postText, classificationTerms);
    const normalizedText = this.normalizeText(postText);
    const uniqueLocationTerms = [...new Set(locationTerms.map((term) => this.normalizeText(term)).filter(Boolean))];
    const locationHits = uniqueLocationTerms.filter((term) => normalizedText.includes(term));
    const minLocationHits = uniqueLocationTerms.length >= 3 ? 2 : 1;

    const hasLocationMatch = uniqueLocationTerms.length
      ? locationHits.length >= minLocationHits
      : true;

    return {
      hasClassificationMatch,
      hasLocationMatch,
      isQualified: hasClassificationMatch && hasLocationMatch
    };
  }

  buildSearchQuery({ title = '', description = '', category = '', locationData = {}, imageValidation = null, resolvedLocationText = '' }) {
    const keywords = this.extractKeywords({ title, description, category });
    const classificationTerms = this.getClassificationTerms(category, imageValidation);

    const hashtags = [...keywords, ...classificationTerms]
      .filter((word) => word.length > 3)
      .slice(0, 4)
      .map((word) => `#${word.replace(/[^a-z0-9]/g, '')}`);

    const locationTerms = this.tokenize(
      resolvedLocationText || `${locationData.address || ''} ${locationData.description || ''}`
    )
      .filter((token) => this.isLikelyLocationToken(token))
      .slice(0, 4);

    // Classification must be explicitly present in result tweets.
    const classificationClause = [...new Set(classificationTerms)]
      .slice(0, 6)
      .map((term) => `"${term}"`)
      .join(' OR ');

    const locationClause = locationTerms.length
      ? `(${locationTerms.map((term) => `"${term}"`).join(' OR ')})`
      : '';

    const baseQuery = classificationClause || `"${(category || 'civic issue').replace(/_/g, ' ')}"`;

    const query = [
      `(${baseQuery})`,
      locationClause,
      keywords.length ? `(${keywords.slice(0, 4).map((term) => `"${term}"`).join(' OR ')})` : '',
      '-is:retweet',
      '-is:reply',
      'lang:en'
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      query,
      keywords,
      classificationTerms,
      hashtags,
      locationTerms,
      resolvedLocationText
    };
  }

  scorePost(post, contextTokens = [], locationTerms = []) {
    const text = (post.text || '').toLowerCase();

    const tokenHits = contextTokens.filter((token) => text.includes(token));
    const textScore = contextTokens.length
      ? Math.min(1, tokenHits.length / Math.max(contextTokens.length, 1))
      : 0;

    const locationHits = locationTerms.filter((term) => text.includes(term));
    const locationScore = locationTerms.length
      ? Math.min(1, locationHits.length / Math.max(locationTerms.length, 1))
      : 0;

    const createdAt = post.created_at ? new Date(post.created_at).getTime() : Date.now();
    const ageMs = Math.max(Date.now() - createdAt, 0);
    const ageHours = ageMs / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 1 - (ageHours / (this.lookbackHours * 1.5)));

    const metrics = post.public_metrics || {};
    const rawEngagement =
      (metrics.like_count || 0) +
      (metrics.retweet_count || 0) +
      (metrics.reply_count || 0) +
      (metrics.quote_count || 0);
    const engagementScore = Math.min(1, Math.log10(rawEngagement + 1) / 2);

    const finalScore =
      (textScore * 0.55) +
      (locationScore * 0.2) +
      (recencyScore * 0.15) +
      (engagementScore * 0.1);

    return {
      textScore: Number(textScore.toFixed(4)),
      locationScore: Number(locationScore.toFixed(4)),
      recencyScore: Number(recencyScore.toFixed(4)),
      engagementScore: Number(engagementScore.toFixed(4)),
      matchScore: Number(Math.min(1, finalScore).toFixed(4))
    };
  }

  getSocialBoost(posts = []) {
    if (!posts.length) {
      return 0;
    }

    const matchedPosts = posts.filter((post) => post.classificationVerified);
    if (!matchedPosts.length) {
      return 0;
    }

    const topPosts = matchedPosts.slice(0, 5);
    const avgScore = topPosts.reduce((sum, post) => sum + (post.matchScore || 0), 0) / topPosts.length;

    return Number(Math.min(0.2, (avgScore * 0.18) + (Math.min(posts.length, 6) * 0.005)).toFixed(4));
  }

  async searchRecentPosts(context) {
    const resolvedLocationText = await this.resolveLocationText(context.locationData || {});
    const { query, keywords, classificationTerms, hashtags, locationTerms } = this.buildSearchQuery({
      ...context,
      resolvedLocationText
    });

    if (!this.isEnabled()) {
      return {
        enabled: false,
        query,
        keywords,
        classificationTerms,
        hashtags,
        locationTerms,
        resolvedLocationText,
        posts: [],
        fetchedCount: 0,
        socialBoost: 0,
        crossValidation: {
          enabled: false,
          verifiedCount: 0,
          evaluatedCount: 0
        },
        message: 'X API is disabled. Set X_BEARER_TOKEN to enable social signal enrichment.'
      };
    }

    const startTime = Date.now();

    try {
      const response = await axios.get(`${this.baseUrl}/tweets/search/recent`, {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`
        },
        params: {
          query,
          max_results: this.maxResults,
          expansions: 'author_id,geo.place_id,attachments.media_keys',
          'tweet.fields': 'id,text,created_at,public_metrics,lang,geo,attachments',
          'user.fields': 'id,username,name,verified',
          'place.fields': 'id,full_name,country,country_code',
          'media.fields': 'media_key,type,url,preview_image_url'
        },
        timeout: 12000
      });

      const fallbackQuery = [
        `(${classificationTerms.map((term) => `"${term}"`).join(' OR ')})`,
        locationTerms.length ? `(${locationTerms.map((term) => `"${term}"`).join(' OR ')})` : '',
        'lang:en'
      ].filter(Boolean).join(' ');

      const effectiveResponse = (response.data?.data || []).length > 0
        ? response
        : await axios.get(`${this.baseUrl}/tweets/search/recent`, {
            headers: {
              Authorization: `Bearer ${this.bearerToken}`
            },
            params: {
              query: fallbackQuery,
              max_results: this.maxResults,
              expansions: 'author_id,geo.place_id,attachments.media_keys',
              'tweet.fields': 'id,text,created_at,public_metrics,lang,geo,attachments',
              'user.fields': 'id,username,name,verified',
              'place.fields': 'id,full_name,country,country_code',
              'media.fields': 'media_key,type,url,preview_image_url'
            },
            timeout: 12000
          });

      const usersById = new Map();
      (effectiveResponse.data?.includes?.users || []).forEach((user) => usersById.set(user.id, user));

      const mediaByKey = new Map();
      (effectiveResponse.data?.includes?.media || []).forEach((media) => mediaByKey.set(media.media_key, media));

      const contextTokens = this.tokenize(
        `${context.title || ''} ${context.description || ''} ${(context.category || '').replace(/_/g, ' ')}`
      );

      const rawPosts = (effectiveResponse.data?.data || []).map((tweet) => {
        const scores = this.scorePost(tweet, contextTokens, locationTerms);
        const user = usersById.get(tweet.author_id) || {};

        const mediaKeys = tweet.attachments?.media_keys || [];
        const mediaItems = mediaKeys.map((key) => mediaByKey.get(key)).filter(Boolean);
        const imageMedia = mediaItems.find((media) => media.type === 'photo') || mediaItems[0] || null;
        const imageUrl = imageMedia?.url || imageMedia?.preview_image_url || null;

        const match = this.hasLocationAndClassificationMatch(
          tweet.text || '',
          locationTerms,
          classificationTerms
        );

        const classificationBonus = match.hasClassificationMatch ? 0.15 : 0;
        const locationBonus = match.hasLocationMatch ? 0.1 : 0;

        return {
          platform: 'x',
          postId: tweet.id,
          postUrl: user.username ? `https://x.com/${user.username}/status/${tweet.id}` : `https://x.com/i/web/status/${tweet.id}`,
          authorHandle: user.username ? `@${user.username}` : null,
          authorName: user.name || null,
          textExcerpt: (tweet.text || '').slice(0, 500),
          postedAt: tweet.created_at || null,
          imageUrl,
          mediaType: imageMedia?.type || null,
          likeCount: tweet.public_metrics?.like_count || 0,
          repostCount: tweet.public_metrics?.retweet_count || 0,
          replyCount: tweet.public_metrics?.reply_count || 0,
          classificationVerified: match.isQualified,
          correlationStatus: match.isQualified ? 'text_classification_and_location_match' : 'text_mismatch',
          classificationMatched: match.hasClassificationMatch,
          locationMatched: match.hasLocationMatch,
          ...scores,
          matchScore: Number(Math.min(1, scores.matchScore + classificationBonus + locationBonus).toFixed(4))
        };
      });

      const matchedPosts = rawPosts
        .filter((post) => post.classificationVerified)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, this.matchedResultsLimit);

      const fetchedPreview = rawPosts.slice(0, 5).map((post) => ({
        postId: post.postId,
        authorHandle: post.authorHandle,
        textExcerpt: (post.textExcerpt || '').slice(0, 180),
        classificationMatched: post.classificationMatched,
        locationMatched: post.locationMatched,
        correlationStatus: post.correlationStatus
      }));

      return {
        enabled: true,
        query,
        keywords,
        classificationTerms,
        hashtags,
        locationTerms,
        resolvedLocationText,
        fetchedCount: rawPosts.length,
        posts: matchedPosts,
        fetchedPreview,
        socialBoost: this.getSocialBoost(matchedPosts),
        crossValidation: {
          enabled: false,
          verifiedCount: matchedPosts.length,
          evaluatedCount: rawPosts.length
        },
        fallbackQueryUsed: (response.data?.data || []).length === 0,
        fallbackQuery,
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      const statusCode = error.response?.status;
      const apiMessage = error.response?.data?.detail || error.response?.data?.title;

      return {
        enabled: true,
        query,
        keywords,
        classificationTerms,
        hashtags,
        locationTerms,
        resolvedLocationText,
        posts: [],
        fetchedCount: 0,
        fetchedPreview: [],
        socialBoost: 0,
        crossValidation: {
          enabled: false,
          verifiedCount: 0,
          evaluatedCount: 0
        },
        processingTimeMs: Date.now() - startTime,
        error: apiMessage || error.message,
        statusCode
      };
    }
  }

  async persistSignals(supabaseClient, complaintId, result) {
    if (!complaintId || !result?.posts?.length) {
      return { persisted: false, reason: 'no_data' };
    }

    const rows = result.posts.map((post) => ({
      complaint_id: complaintId,
      platform: 'x',
      post_id: post.postId,
      post_url: post.postUrl,
      author_handle: post.authorHandle,
      text_excerpt: post.textExcerpt,
      image_url: post.imageUrl,
      posted_at: post.postedAt,
      match_score: post.matchScore,
      text_score: post.textScore,
      location_score: post.locationScore,
      recency_score: post.recencyScore,
      engagement_score: post.engagementScore,
      classification_verified: Boolean(post.classificationVerified),
      correlation_status: post.correlationStatus || null,
      roboflow_class: null,
      roboflow_confidence: 0,
      like_count: post.likeCount,
      repost_count: post.repostCount,
      reply_count: post.replyCount,
      query_used: result.query,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabaseClient
      .from('complaint_social_signals')
      .upsert(rows, { onConflict: 'complaint_id,platform,post_id' });

    if (error) {
      const fallbackRows = rows.map((row) => ({
        complaint_id: row.complaint_id,
        platform: row.platform,
        post_id: row.post_id,
        post_url: row.post_url,
        author_handle: row.author_handle,
        text_excerpt: row.text_excerpt,
        posted_at: row.posted_at,
        match_score: row.match_score,
        text_score: row.text_score,
        location_score: row.location_score,
        recency_score: row.recency_score,
        engagement_score: row.engagement_score,
        like_count: row.like_count,
        repost_count: row.repost_count,
        reply_count: row.reply_count,
        query_used: row.query_used,
        created_at: row.created_at
      }));

      const fallbackInsert = await supabaseClient
        .from('complaint_social_signals')
        .upsert(fallbackRows, { onConflict: 'complaint_id,platform,post_id' });

      if (!fallbackInsert.error) {
        return {
          persisted: true,
          count: fallbackRows.length,
          mode: 'fallback'
        };
      }

      return {
        persisted: false,
        reason: error.message
      };
    }

    return {
      persisted: true,
      count: rows.length
    };
  }

  async getStoredSignals(supabaseClient, complaintId, limit = 5) {
    if (!complaintId) {
      return [];
    }

    const { data, error } = await supabaseClient
      .from('complaint_social_signals')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('match_score', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      platform: row.platform,
      postId: row.post_id,
      postUrl: row.post_url,
      authorHandle: row.author_handle,
      textExcerpt: row.text_excerpt,
      imageUrl: row.image_url || null,
      postedAt: row.posted_at,
      matchScore: Number(row.match_score || 0),
      textScore: Number(row.text_score || 0),
      locationScore: Number(row.location_score || 0),
      recencyScore: Number(row.recency_score || 0),
      engagementScore: Number(row.engagement_score || 0),
      classificationVerified: Boolean(row.classification_verified),
      correlationStatus: row.correlation_status || null,
      classificationMatched: Boolean(row.classification_verified),
      locationMatched: Boolean(row.classification_verified),
      likeCount: row.like_count || 0,
      repostCount: row.repost_count || 0,
      replyCount: row.reply_count || 0
    }));
  }
}

module.exports = XSocialSignalService;
