import { Router, Request, Response } from 'express';
import { unsplashService } from '../services/unsplash.service';

const router = Router();

// GET /api/unsplash/search - Search for images
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, count = '10' } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const images = await unsplashService.searchImages(query, parseInt(count as string));

    res.json({ query, images });
  } catch (error) {
    console.error('Unsplash search error:', error);
    res.status(500).json({ error: 'Failed to search images' });
  }
});

// GET /api/unsplash/image/:id - Get specific image
router.get('/image/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const image = await unsplashService.getImage(id);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json(image);
  } catch (error) {
    console.error('Unsplash get image error:', error);
    res.status(500).json({ error: 'Failed to get image' });
  }
});

// POST /api/unsplash/track-download - Track image download
router.post('/track-download', async (req: Request, res: Response) => {
  try {
    const { imageId } = req.body;

    if (!imageId) {
      return res.status(400).json({ error: 'imageId is required' });
    }

    await unsplashService.trackDownload(imageId);

    res.json({ success: true });
  } catch (error) {
    console.error('Unsplash track download error:', error);
    res.status(500).json({ error: 'Failed to track download' });
  }
});

export default router;
