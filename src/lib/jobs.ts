import { supabase } from './supabase';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type JobQueue = 'default' | 'email' | 'report-card' | 'ai';

export interface BackgroundJob {
  id: string;
  name: string;
  queue: JobQueue;
  data: Record<string, any>;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  error: string | null;
  result?: Record<string, any>;
}

const jobHandlers: Record<string, (data: Record<string, any>) => Promise<Record<string, any>>> = {
  'send-email': async (data) => {
    const { sendEmail } = await import('./email');
    await sendEmail({
      to: data.to,
      subject: data.subject,
      html: data.html,
    });
    return { sent: true };
  },

  'generate-report-card': async (data) => {
    const { studentId, termId } = data;
    
    const { data: results } = await supabase
      .from('results')
      .select('score, percentage, exam:exams(subject:subjects(name))')
      .eq('studentId', studentId)
      .eq('exam.termId', termId)
      .eq('status', 'GRADED');

    if (!results || results.length === 0) {
      return { generated: false, reason: 'No graded results' };
    }

    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const average = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length;

    let grade = 'F';
    if (average >= 90) grade = 'A+';
    else if (average >= 80) grade = 'A';
    else if (average >= 70) grade = 'B';
    else if (average >= 60) grade = 'C';
    else if (average >= 50) grade = 'D';

    await supabase
      .from('report_cards')
      .upsert({
        termId,
        studentId,
        totalScore,
        average,
        grade,
      });

    return { generated: true, grade, average };
  },

  'send-exam-notification': async (data) => {
    const { sendExamNotification } = await import('./email');
    await sendExamNotification(data.to, data.studentName, data.examTitle, data.subject);
    return { sent: true };
  },
};

export async function createJob(
  name: string,
  queue: JobQueue,
  data: Record<string, any>,
  scheduledAt?: Date
): Promise<string> {
  const { data: job, error } = await supabase
    .from('background_jobs')
    .insert({
      name,
      queue,
      data,
      status: 'PENDING',
      scheduledAt: scheduledAt?.toISOString() || null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return job.id;
}

export async function processJob(jobId: string): Promise<void> {
  const { data: job } = await supabase
    .from('background_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!job || job.status === 'COMPLETED' || job.status === 'PROCESSING') {
    return;
  }

  await supabase
    .from('background_jobs')
    .update({ status: 'PROCESSING', startedAt: new Date().toISOString(), attempts: job.attempts + 1 })
    .eq('id', jobId);

  try {
    const handler = jobHandlers[job.name];
    if (!handler) {
      throw new Error(`No handler for job: ${job.name}`);
    }

    const result = await handler(job.data);

    await supabase
      .from('background_jobs')
      .update({
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        result,
      })
      .eq('id', jobId);
  } catch (error: any) {
    if (job.attempts + 1 >= job.maxAttempts) {
      await supabase
        .from('background_jobs')
        .update({
          status: 'FAILED',
          failedAt: new Date().toISOString(),
          error: error.message,
        })
        .eq('id', jobId);
    } else {
      await supabase
        .from('background_jobs')
        .update({ status: 'PENDING' })
        .eq('id', jobId);
    }
  }
}

export async function processQueue(queue: JobQueue, limit: number = 10): Promise<number> {
  const { data: jobs } = await supabase
    .from('background_jobs')
    .select('id')
    .eq('queue', queue)
    .eq('status', 'PENDING')
    .order('createdAt', { ascending: true })
    .limit(limit);

  if (!jobs || jobs.length === 0) return 0;

  let processed = 0;
  for (const job of jobs) {
    await processJob(job.id);
    processed++;
  }

  return processed;
}
