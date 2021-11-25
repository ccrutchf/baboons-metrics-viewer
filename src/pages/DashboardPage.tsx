import React from 'react';

import CumulativeMetrics from '../components/SingularRunMetrics';

class DashboardPage extends React.Component {
    render() {
        return (
            <div className="ms-Grid" dir="ltr">
                <CumulativeMetrics 
                    metricsTransformations={{
                        truePositive: {
                            display: 'True Positive',
                            x: (idx) => idx / 30,
                            xTitle: 'Count',
                            y: (m) => m["true_positive"],
                            yTitle: 'Seconds'
                        },
                        falsePositive: {
                            display: 'False Positive',
                            x: (idx) => idx / 30,
                            xTitle: 'Count',
                            y: (m) => m["false_positive"],
                            yTitle: 'Seconds'
                        },
                        falseNegative: {
                            display: 'False Negative',
                            x: (idx) => idx / 30,
                            xTitle: 'Count',
                            y: (m) => m["false_negative"],
                            yTitle: 'Seconds'
                        },
                        errorRate: {
                            display: 'Error Rate',
                            x: (idx) => idx / 30,
                            xTitle: 'Error Rate',
                            y: (m) => (m["false_positive"] + m["false_negative"]) / (m["true_positive"] + m["false_negative"]),
                            yTitle: 'Seconds'
                        }
                    }} />
            </div>
        );
    }
}

export default DashboardPage;