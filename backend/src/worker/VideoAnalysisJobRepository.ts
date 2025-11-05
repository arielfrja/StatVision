import { DataSource, Repository } from "typeorm";
import { VideoAnalysisJob } from "./VideoAnalysisJob";
import logger from "../config/logger";

export class VideoAnalysisJobRepository {
    private repository: Repository<VideoAnalysisJob>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(VideoAnalysisJob);
    }

    async create(job: VideoAnalysisJob): Promise<VideoAnalysisJob> {
        logger.info(`Creating new video analysis job for game ${job.gameId}`);
        return this.repository.save(job);
    }

    async findOneByGameIdAndFilePath(gameId: string, filePath: string): Promise<VideoAnalysisJob | null> {
        return this.repository.findOne({ where: { gameId, filePath } });
    }

    async findOneById(jobId: string): Promise<VideoAnalysisJob | null> {
        return this.repository.findOne({ where: { id: jobId } });
    }

    async update(job: VideoAnalysisJob): Promise<VideoAnalysisJob> {
        logger.info(`Updating video analysis job ${job.id} for game ${job.gameId}`);
        return this.repository.save(job);
    }
}
