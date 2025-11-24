import { DataSource, Repository } from "typeorm";
import { Chunk, ChunkStatus } from "./Chunk";
import { chunkLogger as logger } from "../config/loggers";

export class ChunkRepository {
    private repository: Repository<Chunk>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(Chunk);
    }

    async create(chunk: Chunk): Promise<Chunk> {
        logger.debug(`Creating new chunk for job ${chunk.jobId}, sequence ${chunk.sequence}`, { phase: 'database' });
        return this.repository.save(chunk);
    }

    async createMany(chunks: Chunk[]): Promise<Chunk[]> {
        logger.debug(`Creating ${chunks.length} chunks.`, { phase: 'database' });
        return this.repository.save(chunks);
    }

    async findByJobId(jobId: string): Promise<Chunk[]> {
        logger.debug(`[ChunkRepository] Finding chunks for jobId: ${jobId}`, { phase: 'database' });
        const chunks = await this.repository.find({ where: { jobId }, order: { sequence: "ASC" } });
        logger.debug(`[ChunkRepository] Found ${chunks.length} chunks for jobId: ${jobId}`, { phase: 'database' });
        return chunks;
    }

    async findOneById(chunkId: string): Promise<Chunk | null> {
        return this.repository.findOne({ where: { id: chunkId } });
    }

    async findByJobIdAndSequence(jobId: string, sequence: number): Promise<Chunk | null> {
        logger.debug(`[ChunkRepository] Finding chunk for jobId: ${jobId}, sequence: ${sequence}`, { phase: 'database' });
        return this.repository.findOne({ where: { jobId, sequence } });
    }

    async update(chunk: Chunk): Promise<Chunk> {
        logger.debug(`Updating chunk ${chunk.id} for job ${chunk.jobId}, status: ${chunk.status}`, { phase: 'database' });
        return this.repository.save(chunk);
    }

    async updateStatus(chunkId: string, status: ChunkStatus): Promise<void> {
        await this.repository.update(chunkId, { status });
    }

    async countAnalyzingChunksForSequence(sequence: number): Promise<number> {
        const count = await this.repository.count({
            where: {
                sequence: sequence,
                status: ChunkStatus.ANALYZING
            }
        });
        logger.debug(`[ChunkRepository] Found ${count} ANALYZING chunks for sequence ${sequence}.`, { phase: 'database' });
        return count;
    }
}
