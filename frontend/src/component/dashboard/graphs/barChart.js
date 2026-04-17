import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, Rectangle } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';

import style from "../../../style/dashboard.module.css";

const COLORS = ["#0088FE", "#D98012"];

// #endregion
const SimpleBarChart = ({data, changeData, title}) => {
  console.log(data);
  const sendData = (shape) => {
    changeData("status", shape.status);
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div style={{ display: "flex", gap: "10px", paddingLeft: "40px" }}>
        {data.map((entry, index) => (
          <div key={`legend-${index}`} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div
              style={{
                width: 10,
                height: 10,
                backgroundColor: index === 0 ? "#5588dd" : "#dd8855",
              }}
            />
            <span>{entry.status}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={style.block + " " + style.graph}>
      <div className={style.title}>
        {title}
      </div>

      <BarChart
        style={{ width: '100%', maxWidth: '300px', maxHeight: '150px', aspectRatio: 1.618, paddingTop:"15px"}}
        responsive
        data={data}
        margin={{
          top: 5,
          right: 0,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="status"/>
        <YAxis width="auto" />
        <Tooltip />
        <Legend verticalAlign='top'wrapperStyle={{paddingLeft:"40px"}} content={CustomLegend}/>
        <Bar dataKey={"num"} fill={"#5588dd"} 
             activeBar={{fill: "#ffff22", stroke: "green"}} radius={[20, 20, 0, 0]} 
             barSize={50}>
          {data.map((entry, index) => (
            <Cell key={`Cell-${index}`} fill={index === 0 ? "#5588dd" : "#dd8855"} name='Real' />
          ))}
        </Bar>

        <RechartsDevtools />
      </BarChart> 
    </div>
  );
};

export default SimpleBarChart;