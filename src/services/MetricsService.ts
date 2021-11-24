import { FirebaseApp, initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

class MetricsService {
    private static app: FirebaseApp;
    private db;

    constructor() {
        const config = {
            apiKey: "AIzaSyB83cPhCkA-xv-K6UOZAc0zuH7sxDuxHlE",
            authDomain: "baboon-cli-1598770091002.firebaseapp.com",
            databaseURL: "https://baboon-cli-1598770091002-default-rtdb.firebaseio.com/",
        };
        
        if (!MetricsService.app) {
            MetricsService.app = initializeApp(config);
        }
        this.db = getDatabase(MetricsService.app);
    }

    async getVideoFilesAsync() : Promise<string[]> {
        const videoFilesRef = ref(this.db, "metrics/video_files");
        const videoFilesQuery = await get(videoFilesRef);
        const videoFiles = videoFilesQuery.val();
        
        return videoFiles;
    }

    async getBranchesAsync(videoFile: string) : Promise<string[]> {
        const branchesRef = ref(this.db, `metrics/${videoFile}/branches`);
        const branchesQuery = await get(branchesRef);
        const branches: string[] = branchesQuery.val();

        return branches.map(b => b.replace('__slash__', '/'));
    }

    async getDatesAsync(videoFile: string, branches: string[]) : Promise<number[]> {
        const dateArrays = await Promise.all(branches.map(async b => {
            const datesRef = ref(this.db, `metrics/${videoFile}/${b.replace('/', '__slash__')}/dates`);
            const datesQuery = await get(datesRef);
            const dates: string[] = datesQuery.val();

            return dates.map(d => this.parseDate(d));
        }));

        return dateArrays.flatMap(d => d);
    }

    async getMetricTypesAsync(videoFile: string, branches: string[], dates: number[]) : Promise<string[]> {
        const metricsTypeArrays = await Promise.all(branches.map(async b => {
            const serverDates = new Set(await this.getDatesAsync(videoFile, [b]));
            const filteredDates = dates.filter(d => serverDates.has(d));

            const metricsTypeArrays = await Promise.all(filteredDates.map(async d => {

                const metricTypesRef = ref(this.db, `metrics/${videoFile}/${b.replace('/', '__slash__')}/${this.dateToString(d)}/metric_types`);
                const metricTypesQuery = await get(metricTypesRef);
                const metricTypes: string[] = metricTypesQuery.val();

                return metricTypes;
            }));

            return Array.from(metricsTypeArrays.flatMap(m => m));
        }));

        return Array.from(new Set(metricsTypeArrays.flatMap(m => m)));
    }

    async getMetricTagsAsync(videoFile: string, branches: string[], dates: number[]) {
        const metricTagsArrays = await Promise.all(branches.map(async b => {
            const serverDates = new Set(await this.getDatesAsync(videoFile, [b]));
            const filteredDates = dates.filter(d => serverDates.has(d));

            const metricTagsArrays = await Promise.all(filteredDates.map(async d => {

                const metricTypesRef = ref(this.db, `metrics/${videoFile}/${b.replace('/', '__slash__')}/${this.dateToString(d)}/tags`);
                const metricTypesQuery = await get(metricTypesRef);
                const metricTypes: string[] = metricTypesQuery.val() ?? [];

                return metricTypes;
            }));

            return Array.from(metricTagsArrays.flatMap(m => m));
        }));

        return ["Untagged"].concat(Array.from(new Set(metricTagsArrays.flatMap(m => m))));
    }

    async getMetricsAsync(videoFile: string, branches: string[], dates: number[], metricType: string, metricTags: string[]) : Promise<{
        branch: string,
        date: number,
        metrics: number[]
    }[]> {
        const metricArrays = await Promise.all(branches.map(async b => {
            const metrics = await Promise.all(dates.map(async d => {
                const metricsObjectRef = ref(this.db, `metrics/${videoFile}/${b.replace('/', '__slash__')}/${this.dateToString(d)}`);
                const metricsObjectQuery = await get(metricsObjectRef);
                const metricsObject: {
                    metric_types: string[],
                    metrics: any[],
                    tags: string[]
                } = metricsObjectQuery.val()
                const tagsSet = new Set(["Untagged"].concat(metricsObject.tags ?? []));
                const containsTag = metricTags.some(t => tagsSet.has(t));

                if (containsTag) {
                    return {
                        branch: b,
                        date: d,
                        metrics: metricsObject.metrics
                    };
                } else {
                    return null;
                }
            }));

            return metrics.filter(x => x !== null) as {
                branch: string,
                date: number,
                metrics: number[]
            }[];
        }));

        return metricArrays.flatMap(x => x);
    }

    private parseDate(dateString: string): number {
        const [datePart, timePart] = dateString.split('-');
        const year = parseInt(datePart.substr(0, 4));
        const month = parseInt(datePart.substr(4, 2)) - 1;
        const day = parseInt(datePart.substr(6, 2));

        const hour = parseInt(timePart.substr(0, 2));
        const minute = parseInt(timePart.substr(2, 2));
        const second = parseInt(timePart.substr(4, 2));

        return Date.UTC(year, month, day, hour, minute, second);
    }

    private dateToString(dateNumber: number): string {
        const date = new Date(dateNumber);

        return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}-` + 
            `${String(date.getUTCHours()).padStart(2, '0')}${String(date.getUTCMinutes()).padStart(2, '0')}${String(date.getUTCSeconds()).padStart(2, '0')}`;
    }
}

export default MetricsService;