import { AppDataSource } from "./src/data-source";
import { VideoAnalysisJob, VideoAnalysisJobStatus } from "./src/core/entities/VideoAnalysisJob";

async function test() {
    await AppDataSource.initialize();
    console.log("DB Init");
    const job = new VideoAnalysisJob();
    job.gameId = '72cc3563-dca7-4a5f-9169-5ae96eebd055';
    job.userId = 'e1019f4d-7cef-44bc-8009-15cf6342dd11';
    job.filePath = '/data/data/com.termux/files/home/data/development/StatVision/uploads/1770631155222-clipped_video.webm';
    job.status = VideoAnalysisJobStatus.PENDING;
    job.chunks = [];
    
    try {
        await AppDataSource.getRepository(VideoAnalysisJob).save(job);
        console.log("Success");
    } catch (e) {
        console.error("FAILURE:", e);
    }
}

test();
