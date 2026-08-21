import { hrtime } from 'process';

export interface RunTelemetry {
  run_id: string;
  start_monotonic: bigint;
  started_at: string;
  stages: Record<string, number>; // duration_ms
}

export class TelemetryTracker {
  private run_id: string;
  private start_monotonic: bigint;
  private started_at: string;
  private stages: Record<string, number> = {};

  constructor(run_id: string) {
    this.run_id = run_id;
    this.start_monotonic = hrtime.bigint();
    this.started_at = new Date().toISOString();
  }

  recordStage(stageName: string, durationMs: number) {
    this.stages[stageName] = durationMs;
  }

  getCriticalPathDuration(): number {
    // Sum of stages in the critical path
    return Object.values(this.stages).reduce((a, b) => a + b, 0);
  }

  getTelemetry(): any {
    return {
      run_id: this.run_id,
      started_at: this.started_at,
      completed_at: new Date().toISOString(),
      stages: this.stages,
      critical_path_duration_ms: this.getCriticalPathDuration()
    };
  }
}
