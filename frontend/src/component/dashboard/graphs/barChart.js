import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, Rectangle } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';

import style from "../../../style/dashboard.module.css";

const COLORS = ["#0088FE", "#D98012"];

// #endregion
const SimpleBarChart = ({data, changeData}) => {
  const sendData = (shape) => {
    changeData("status", shape.status);
  };

  const customBar = (prop) => {
    return <Rectangle {...prop} fill={COLORS[prop.index]} />
  }

  return (
    <div className={style.block + " " + style.graph}>
      <div className={style.title}>
        Count of Regular and Irregular Students
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
        <XAxis dataKey="status" reversed={true}/>
        <YAxis width="auto" />
        <Tooltip />
        <Legend verticalAlign='top'wrapperStyle={{paddingLeft:"40px"}}/>
        <Bar name="Regular" fill='#0088FE' dataKey="num" barSize={50} activeBar={{ fill: 'pink', stroke: 'blue' }} 
        radius={[10, 10, 0, 0]} onClick={sendData} shape={customBar}>
        </Bar>
        <Bar name= "Irregular" fill='#d98012'/>
        <RechartsDevtools />
      </BarChart> 
    </div>
  );
};

export default SimpleBarChart;