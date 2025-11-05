import fetch from 'node-fetch';

/**
 * Unsplash Service for image search
 */

interface UnsplashImage {
  id: string;
  url: string;
  thumbnail: string;
  description: string | null;
  photographer: string;
  photographerUrl: string;
}

export class UnsplashService {
  private apiKey: string;
  private baseUrl = 'https://api.unsplash.com';

  constructor() {
    this.apiKey = process.env.UNSPLASH_ACCESS_KEY || '';
    if (!this.apiKey) {
      console.warn('UNSPLASH_ACCESS_KEY not set, image search will be disabled');
    }
  }

  /**
   * Search for images by query
   */
  async searchImages(query: string, count: number = 10): Promise<UnsplashImage[]> {
    if (!this.apiKey) {
      throw new Error('Unsplash API key not configured');
    }

    const url = `${this.baseUrl}/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json() as any;

      return data.results.map((photo: any) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumbnail: photo.urls.thumb,
        description: photo.description || photo.alt_description,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
      }));
    } catch (error) {
      console.error('Unsplash search failed:', error);
      throw new Error('Failed to search images');
    }
  }

  /**
   * Get a specific image by ID
   */
  async getImage(imageId: string): Promise<UnsplashImage | null> {
    if (!this.apiKey) {
      throw new Error('Unsplash API key not configured');
    }

    const url = `${this.baseUrl}/photos/${imageId}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const photo = await response.json() as any;

      return {
        id: photo.id,
        url: photo.urls.regular,
        thumbnail: photo.urls.thumb,
        description: photo.description || photo.alt_description,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
      };
    } catch (error) {
      console.error('Unsplash get image failed:', error);
      throw new Error('Failed to get image');
    }
  }

  /**
   * Track download (required by Unsplash API guidelines)
   */
  async trackDownload(imageId: string): Promise<void> {
    if (!this.apiKey) return;

    const url = `${this.baseUrl}/photos/${imageId}/download`;

    try {
      await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${this.apiKey}`,
        },
      });
    } catch (error) {
      console.error('Failed to track download:', error);
      // Don't throw - this is just for analytics
    }
  }
}

export const unsplashService = new UnsplashService();
