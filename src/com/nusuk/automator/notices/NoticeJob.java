package com.nusuk.automator.notices;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;

import com.nusuk.automator.update.UpdateChecker;

/** Periodic background check for new announcements and app updates (see Notices & UpdateChecker). */
public class NoticeJob extends JobService {
    private volatile Thread worker;

    @Override
    public boolean onStartJob(JobParameters params) {
        worker = new Thread(() -> {
            Context app = getApplicationContext();
            boolean okNotices = Notices.check(app);
            boolean okUpdate = UpdateChecker.checkInBackground(app);
            jobFinished(params, !(okNotices && okUpdate)); // retry with backoff if offline/failed
        }, "NoticeJob");
        worker.start();
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        Thread t = worker;
        if (t != null) t.interrupt();
        return true;
    }
}
