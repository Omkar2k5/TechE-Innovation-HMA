import Chart from "../components/Chart";

export default function Analytics() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">System Analytics</h1>
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Revenue Trends</h2>
        <Chart />
      </div>
    </div>
  );
}
