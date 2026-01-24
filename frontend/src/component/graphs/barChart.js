import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, Rectangle } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';

import style from "../../style/dashboard.module.css";



// #endregion
const SimpleBarChart = ({data, changeData}) => {
  const sendData = (shape) => {
    changeData(shape.name, shape.value);
  };

  return (
    <div className={style.block + " " + style.graph}>
      <div className={style.title}>
        Count of Regular and Irregular Students
      </div>
      <BarChart
        style={{ width: '300px', maxWidth: '300px', maxHeight: '20vh', aspectRatio: 1.618, display: 'flexbox', paddingTop:"15px"}}
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
        <XAxis dataKey="status" />
        <YAxis width="auto" />
        <Tooltip />
        <Legend  verticalAlign='top' itemSorter={(item) => {
          return item.name === 'Regular' ? -1 : 1;
        }}/>
        
        <Bar name="Regular" fill='#0088FE' dataKey="num" barSize={50} activeBar={{ fill: 'pink', stroke: 'blue' }} radius={[10, 10, 0, 0]} onClick={sendData}>
          <Rectangle name="status" fill="#0088FE" value="Regular"/>
          <Rectangle name="status" fill="#d98012" value="Irregular"/>
        </Bar>
        <Bar name= "Irregular" fill='#d98012'/>
        <RechartsDevtools />
      </BarChart> 
    </div>
  );
};

export default SimpleBarChart;