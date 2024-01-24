import { NextApiRequest, NextApiResponse } from 'next';
import { cacheTime, fetchTreasuryAssets } from '@/services/treasury';
import { ExternalAPICallError } from '@/error';

/**
 * @swagger
 * /v2/treasury:
 *  get:
 *    tags: [Treasury]
 *    summary: Get mantle treasury balance
 *
 *    description: |-
 *      **Returns mantle treasury token supply data**
 *
 *    parameters:
 *
 *    responses:
 *
 *      200:
 *        description: token list
 *        content:
 *           application/json:
 *             schema:
 *               title: Treasury
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TreasuryTokenBalance'
 *
 */
export default async function treasury(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    );
    if (req.method == 'OPTIONS') {
      res.setHeader(
        'Access-Control-Allow-Methods',
        'PUT, POST, PATCH, DELETE, GET',
      );
      return res.status(200).end();
    }

    res.setHeader(
      'Cache-Control',
      `max-age==${cacheTime},public,must-revalidate`,
    );

    const result = await fetchTreasuryAssets();
    res.json(result);
  } catch (error: unknown) {
    console.error(error);

    if (error instanceof ExternalAPICallError) {
      res.status(500).json({
        code: error.code,
        message: `Call [${error.apiName}] failed.`,
      });
      return;
    }

    res.status(500).json({
      code: 'UNKNOWN_ERROR',
      message: 'UNKNOWN_ERROR',
    });
  }
}
