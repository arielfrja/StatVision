import { DataSource, Repository } from "typeorm";
import { AiUsageRecord, AiUsageType } from "../entities/AiUsageRecord";

export class AiUsageService {
    private repository: Repository<AiUsageRecord>;

    constructor(private dataSource: DataSource) {
        this.repository = this.dataSource.getRepository(AiUsageRecord);
    }

    async recordTokenUsage(userId: string, inputTokens: number, outputTokens: number, model: string, resourceId?: string): Promise<AiUsageRecord> {
        const record = new AiUsageRecord();
        record.userId = userId;
        record.type = AiUsageType.TOKEN;
        record.amount = inputTokens + outputTokens;
        record.inputTokens = inputTokens;
        record.outputTokens = outputTokens;
        record.model = model;
        record.resourceId = resourceId || null;
        return await this.repository.save(record);
    }

    async recordVideoUsage(userId: string, seconds: number, resourceId?: string): Promise<AiUsageRecord> {
        const record = new AiUsageRecord();
        record.userId = userId;
        record.type = AiUsageType.VIDEO_SECONDS;
        record.amount = seconds;
        record.resourceId = resourceId || null;
        return await this.repository.save(record);
    }

    async getUsageSummary(userId: string, startTime: Date, endTime: Date) {
        const records = await this.repository.createQueryBuilder("record")
            .where("record.user_id = :userId", { userId })
            .andWhere("record.created_at >= :startTime", { startTime })
            .andWhere("record.created_at <= :endTime", { endTime })
            .getMany();

        const summary = {
            totalTokens: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalVideoSeconds: 0,
            records: records
        };

        records.forEach(record => {
            if (record.type === AiUsageType.TOKEN) {
                summary.totalTokens += record.amount;
                summary.totalInputTokens += record.inputTokens || 0;
                summary.totalOutputTokens += record.outputTokens || 0;
            } else if (record.type === AiUsageType.VIDEO_SECONDS) {
                summary.totalVideoSeconds += record.amount;
            }
        });

        return summary;
    }

    async getDailyUsage(userId: string, startTime: Date, endTime: Date) {
        const results = await this.repository.createQueryBuilder("record")
            .select("DATE(record.created_at)", "date")
            .addSelect("record.type", "type")
            .addSelect("SUM(record.amount)", "total")
            .where("record.user_id = :userId", { userId })
            .andWhere("record.created_at >= :startTime", { startTime })
            .andWhere("record.created_at <= :endTime", { endTime })
            .groupBy("DATE(record.created_at)")
            .addGroupBy("record.type")
            .orderBy("date", "ASC")
            .getRawMany();

        return results;
    }
}
