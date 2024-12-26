import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const TaskChart = ({ workerCompletionCounts }: any) => {
    const labels = Object.keys(workerCompletionCounts);
    const data = Object.values(workerCompletionCounts);

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Completed Tasks',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return (<div style={{ height: '500px', width: '100%' }}>
        <Bar data={chartData} options={options} />
    </div>);
};

export default TaskChart;
