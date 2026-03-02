import { DataSource, Repository, In } from "typeorm";
import { VideoAnalysisJob, VideoAnalysisJobStatus } from "../core/entities/VideoAnalysisJob";
import { jobLogger as logger } from "../config/loggers";

export class VideoAnalysisJobRepository {
    private repository: Repository<VideoAnalysisJob>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(VideoAnalysisJob);
    }

    async create(job: VideoAnalysisJob): Promise<VideoAnalysisJob> {
        logger.info(`Creating new video analysis job for game ${job.gameId}`, { phase: 'database' });
        try {
            return await this.repository.save(job);
        } catch (error: any) {
            logger.error(`Failed to create video analysis job: ${error.message}`, { error, phase: 'database' });
            throw error;
        }
    }

    async findOneByGameIdAndFilePath(gameId: string, filePath: string): Promise<VideoAnalysisJob | null> {
        return this.repository.findOne({ where: { gameId, filePath } });
    }

    async findOneById(jobId: string): Promise<VideoAnalysisJob | null> {
        return this.repository.findOne({ where: { id: jobId } });
    }

    async update(id: string, partialJob: Partial<VideoAnalysisJob>): Promise<void> {
        if (!id) {
            logger.warn(`Attempted to update VideoAnalysisJob with empty ID.`, { partialJob, phase: 'database' });
            return;
        }
        logger.debug(`Updating partial video analysis job ${id}: ${JSON.stringify(partialJob)}`, { phase: 'database' });
        await this.repository.update(id, partialJob);
    }

    async find(options: import("typeorm").FindManyOptions<VideoAnalysisJob>): Promise<VideoAnalysisJob[]> {
        return this.repository.find(options);
    }

    async findExistingJob(gameId: string, filePath: string): Promise<VideoAnalysisJob | null> {
        return this.repository.findOne({
            where: {
                gameId,
                filePath,
                status: In([VideoAnalysisJobStatus.PENDING, VideoAnalysisJobStatus.PROCESSING, VideoAnalysisJobStatus.COMPLETED])
            }
        });
    }
}
