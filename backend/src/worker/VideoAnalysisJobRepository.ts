import { DataSource, Repository, In } from "typeorm";
import { VideoAnalysisJob, VideoAnalysisJobStatus } from "./VideoAnalysisJob";
import { jobLogger as logger } from "../config/loggers";

export class VideoAnalysisJobRepository {
    private repository: Repository<VideoAnalysisJob>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(VideoAnalysisJob);
    }

    async create(job: VideoAnalysisJob): Promise<VideoAnalysisJob> {
        logger.info(`Creating new video analysis job for game ${job.gameId}`, { phase: 'database' });
        return this.repository.save(job);
    }

    async findOneByGameIdAndFilePath(gameId: string, filePath: string): Promise<VideoAnalysisJob | null> {
        return this.repository.findOne({ where: { gameId, filePath } });
    }

    async findOneById(jobId: string): Promise<VideoAnalysisJob | null> {
        return this.repository.findOne({ where: { id: jobId } });
    }

    async update(id: string, partialJob: Partial<VideoAnalysisJob>): Promise<void> {
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
