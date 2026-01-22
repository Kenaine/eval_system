import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';

import style from "../../style/dashboard.module.css";

// #region Sample data
const data = [
  {
    name: 'Regular',
    num: 32,
  },
  {
    name: 'Irregular',
    num: 16
  },

];

// #endregion
const SimpleBarChart = () => {
  return (
    <div className={style.block + " " + style.graph}>
      <div className={style.title}>
        Count of Regular and Irregular Students
      </div>
      <BarChart
        style={{ width: '300px', maxWidth: '300px', maxHeight: '20vh', aspectRatio: 1.618, display: 'flexbox' }}
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
        <XAxis dataKey="name" />
        <YAxis width="auto" />
        <Tooltip />
        <Legend  verticalAlign='top' itemSorter={(item) => {
          return item.name === 'Regular' ? -1 : 1;
        }}/>
        <Bar name="Regular" fill='#0088FE' dataKey="num" barSize={50} activeBar={{ fill: 'pink', stroke: 'blue' }} radius={[10, 10, 0, 0]}>
          <Cell name="#Regular" fill="#0088FE" />
          <Cell name="#Irregular" fill="#d98012" />
        </Bar>
        <Bar name= "Irregular" fill='#d98012'/>
        <RechartsDevtools />
      </BarChart> 
    </div>
  );
};

export default SimpleBarChart;