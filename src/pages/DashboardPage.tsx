import React from 'react';

import CumulativeMetrics from '../components/SingularRunMetrics';

class DashboardPage extends React.Component {
    render() {
        return (
            <div className="ms-Grid" dir="ltr">
                <CumulativeMetrics 
                    metricsTransformations={{
                        truePositive: {
                            y: (m) => m["true_positive"]
                        },
                        falsePositive: {
                            y: (m) => m["false_positive"]
                        },
                        falseNegative: {
                            y: (m) => m["false_negative"],
                        },
                        errorRate: {
                            y: (m) => (m["false_positive"] + m["false_negative"]) / (m["true_positive"] + m["false_negative"])
                        }
                    }} />
            </div>
        );
    }
}

export default DashboardPage;