import { DataSource, Repository } from "typeorm";
import { Chunk, ChunkStatus } from "./Chunk";
import logger from "../config/logger";

export class ChunkRepository {
    private repository: Repository<Chunk>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(Chunk);
    }

    async create(chunk: Chunk): Promise<Chunk> {
        logger.debug(`Creating new chunk for job ${chunk.jobId}, sequence ${chunk.sequence}`);
        return this.repository.save(chunk);
    }

    async createMany(chunks: Chunk[]): Promise<Chunk[]> {
        logger.debug(`Creating ${chunks.length} chunks.`);
        return this.repository.save(chunks);
    }

    async findByJobId(jobId: string): Promise<Chunk[]> {
        return this.repository.find({ where: { jobId }, order: { sequence: "ASC" } });
    }

    async findOneById(chunkId: string): Promise<Chunk | null> {
        return this.repository.findOne({ where: { id: chunkId } });
    }

    async update(chunk: Chunk): Promise<Chunk> {
        logger.debug(`Updating chunk ${chunk.id} for job ${chunk.jobId}, status: ${chunk.status}`);
        return this.repository.save(chunk);
    }

    async updateStatus(chunkId: string, status: ChunkStatus): Promise<void> {
        await this.repository.update(chunkId, { status });
    }
}
