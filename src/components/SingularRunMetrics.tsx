import React from 'react';

import {
    Dropdown,
    IDropdownOption,
    Label,
} from '@fluentui/react';
import { Line } from 'react-chartjs-2';

import MetricsService from '../services/MetricsService';

interface MetricsTransformation {
    display: string;
    x: (idx: number) => number;
    xTitle: string;
    y: (metric: any) => number;
    yTitle: string;
}

interface Props {
    metricsTransformations: {
        [name: string]: MetricsTransformation;
    };
}

interface State {
    dates: IDropdownOption[];
    branches: IDropdownOption[];
    metricsData: {
        datasets: any[]
    };
    metricsTags: IDropdownOption[];
    metricsType: IDropdownOption[];
    selectedVideoFile?: string;
    videoFiles: IDropdownOption[];
}

class SingularRunMetrics extends React.Component<Props, State> {
    private metricsService: MetricsService;
    private selectedVideoFile?: string;
    private selectedBranches: Set<string> = new Set();
    private selectedDates: Set<number> = new Set();
    private selectedMetricsType?: string;
    private selectedMetricTags: Set<string> = new Set();

    private metricsTransform?: MetricsTransformation;

    constructor(props: Props | Readonly<Props>) {
        super(props)

        this.state = {
            dates: [],
            branches: [],
            metricsData: {
                datasets: []
            },
            metricsTags: [],
            metricsType: Object.keys(props.metricsTransformations).map(k => ({
                key: k,
                text: props.metricsTransformations[k].display,
                data: props.metricsTransformations[k]
            })),
            videoFiles: []
        }

        this.metricsService = new MetricsService();
    }

    async componentDidMount() {
        await this.updateVideoFilesAsync()
    }

    async updateVideoFilesAsync() {
        const videoFiles = await this.metricsService.getVideoFilesAsync()

        this.setState(() => ({
            videoFiles: videoFiles.map(f => ({
                key: f,
                text: f
            }))
        }));
    }

    async updateBranchesAsync(selectedVideoFile: string | number | undefined) {
        if (typeof selectedVideoFile === 'string') {
            this.selectedVideoFile = selectedVideoFile;
            const branches = await this.metricsService.getBranchesAsync(selectedVideoFile);

            this.setState(() => ({
                branches: branches.map(b => ({
                    key: b,
                    text: b
                }))
            }));
        }
    }

    async updateDatesAsync(branch: string | number | undefined, selected: boolean | undefined) {
        if (typeof this.selectedVideoFile === 'string' && typeof branch === 'string' && typeof selected === 'boolean') {
            if (selected) {
                this.selectedBranches.add(branch);
            } else {
                this.selectedBranches.delete(branch);
            }

            const dates = await this.metricsService.getDatesAsync(this.selectedVideoFile, Array.from(this.selectedBranches))

            this.setState(() => ({
                dates: dates.map(d => ({
                    key: d,
                    text: new Date(d).toLocaleString()
                }))
            }));
        }
    }

    async updateMetricsTagsAsync(date: string | number | undefined, selected : boolean | undefined) {
        if (typeof this.selectedVideoFile === 'string' && typeof date === 'number' && typeof selected === 'boolean') {
            if (selected) {
                this.selectedDates.add(date);
            } else {
                this.selectedDates.delete(date);
            }

            const metricTags = await this.metricsService.getMetricTagsAsync(this.selectedVideoFile, Array.from(this.selectedBranches), Array.from(this.selectedDates));

            this.setState(() => ({
                metricsTags: metricTags.map(m => ({
                    key: m,
                    text: m
                }))
            }));
        }
    }

    async handleMetricTypeAsync(metricsType: string | number | undefined, transfom: any) {
        if (typeof metricsType === 'string') {
            this.selectedMetricsType = metricsType;

            this.metricsTransform = transfom;
        }

        await this.updateChartAsync();
    }

    async handleMetricTagsAsync(tag: string | number | undefined, selected : boolean | undefined) {
        if (typeof tag === 'string' && typeof selected === 'boolean') {
            if (selected) {
                this.selectedMetricTags.add(tag);
            } else {
                this.selectedMetricTags.delete(tag);
            }
        }

        await this.updateChartAsync();
    }

    async updateChartAsync() {
        if (typeof this.selectedVideoFile === 'string' &&
            typeof this.selectedMetricsType === 'string' &&
            typeof this.metricsTransform === 'object' &&
            this.selectedMetricTags.size > 0) {
                const metrics = await this.metricsService.getMetricsAsync(
                                this.selectedVideoFile,
                                Array.from(this.selectedBranches),
                                Array.from(this.selectedDates),
                                this.selectedMetricsType,
                                Array.from(this.selectedMetricTags));

                this.setState(() => ({
                    metricsData: {
                        datasets: metrics.map(m => ({
                            label: `${m.branch}:${new Date(m.date).toLocaleString()} - ${this.metricsTransform?.display}`,
                            data: m.metrics.map((d, idx) => ({
                                x: this.metricsTransform?.x(idx),
                                y: this.metricsTransform?.y(d)
                            }))
                        }))
                    }
            }));
        }
    }

    render() {
        const disableVideoFile = this.state.videoFiles.length === 0;
        const disableBranch = this.state.branches.length === 0;
        const disableDate = this.state.dates.length === 0;
        const disableMetricsType = this.state.metricsType.length === 0;
        const disableMetricsTags = this.state.metricsTags.length === 0;

        return (
            <div className="ms-Grid" dir="ltr">
                <div className="ms-Grid-row">
                    <div className="ms-Grid-col ms-sm2">
                        <Label>Video File</Label>
                        <Dropdown
                            options={this.state.videoFiles}
                            disabled={disableVideoFile}
                            onChange={(p, o) => this.updateBranchesAsync(o?.key)} />
                    </div>

                    <div className="ms-Grid-col ms-sm2">
                        <Label>Branch</Label>
                        <Dropdown
                            options={this.state.branches}
                            disabled={disableBranch}
                            onChange={(p, o) => this.updateDatesAsync(o?.key, o?.selected)}
                            multiSelect />
                    </div>

                    <div className="ms-Grid-col ms-sm2">
                        <Label>Date</Label>
                        <Dropdown
                            options={this.state.dates}
                            disabled={disableDate}
                            onChange={(p, o) => this.updateMetricsTagsAsync(o?.key, o?.selected)}
                            multiSelect />
                    </div>

                    <div className="ms-Grid-col ms-sm3">
                        <Label>Metrics Type</Label>
                        <Dropdown
                            options={this.state.metricsType}
                            disabled={disableMetricsType}
                            onChange={(p, o) => this.handleMetricTypeAsync(o?.key, o?.data)} />
                    </div>

                    <div className="ms-Grid-col ms-sm3">
                        <Label>Metrics Tags</Label>
                        <Dropdown
                            options={this.state.metricsTags}
                            disabled={disableMetricsTags}
                            onChange={(p, o) => this.handleMetricTagsAsync(o?.key, o?.selected)}
                            multiSelect />
                    </div>
                </div>

                <div className="ms-Grid-row">
                    <Line
                        data={this.state.metricsData}

                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top' as const,
                                },
                                title: {
                                    display: true,
                                    text: `${this.metricsTransform?.display}: ${this.metricsTransform?.yTitle} vs. ${this.metricsTransform?.xTitle}`,
                                },
                            },
                            scales: {
                                x: {
                                    type: 'linear' as const,
                                    axis: 'x',
                                    title: {
                                        display: true,
                                        text: this.metricsTransform?.yTitle
                                    }
                                },
                                y: {
                                    type: 'linear' as const,
                                    axis: 'y',
                                    title: {
                                        display: true,
                                        text: this.metricsTransform?.xTitle
                                    }
                                }
                            }
                        }} />
                </div>
            </div>
        );
    }
}

export default SingularRunMetrics;