import { NextApiRequest, NextApiResponse } from 'next';
import { cacheTime, statisticTreasuryTokenList } from '@/services/treasury';
import { ExternalAPICallError } from '@/error';

/**
 * @swagger
 * /v2/treasury/statistics:
 *  get:
 *    tags: [Treasury]
 *    summary: Static the well known tokens.
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
 *               title: TreasuryStatistic
 *               $ref: '#/components/schemas/TreasuryStatistic'
 *
 */
export default async function statistics(
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

    const result = await statisticTreasuryTokenList();
    res.json({ ...result, cacheTime });
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

