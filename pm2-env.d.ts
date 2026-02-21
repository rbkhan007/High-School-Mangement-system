declare module 'pm2' {
    export interface StartOptions {
        name?: string;
        script?: string;
        cwd?: string;
        args?: string | string[];
        interpreter?: string;
        interpreter_args?: string | string[];
        node_args?: string | string[];
        instances?: number | string;
        exec_mode?: string;
        watch?: boolean | string | string[];
        ignore_watch?: string | string[];
        max_memory_restart?: number | string;
        env?: { [key: string]: string | undefined };
        env_production?: { [key: string]: string | undefined };
        autorestart?: boolean;
        cron_restart?: string;
        restart_delay?: number;
        error_file?: string;
        out_file?: string;
        merge_logs?: boolean;
        log_date_format?: string;
        [key: string]: any;
    }

    export interface RunOptions extends StartOptions { }
}
