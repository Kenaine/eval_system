import { Cell, Legend, Pie, PieChart, PieLabelRenderProps } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';

import style from "../../style/dashboard.module.css";

// #region Sample data

// #endregion
const RADIAN = Math.PI / 180;
const COLORS = ['#0088FE', '#00C49F'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (cx == null || cy == null || innerRadius == null || outerRadius == null) {
    return null;
  }
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const ncx = Number(cx);
  const x = ncx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
  const ncy = Number(cy);
  const y = ncy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > ncx ? 'start' : 'end'} dominantBaseline="central">
      {`${((percent ?? 1) * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PieChartWithCustomizedLabel({ isAnimationActive = true, data }) {
  return (
    <div className={style.block + " " + style.graph}>
      <div className={style.title}>
        Percentage of Transfer Students
      </div>
      <div style={{display:"flex", flexDirection:"row", width:"100%", height:"90%"}}>
        <PieChart style={{ width: '100%', height: '100%', aspectRatio: 1 }} responsive>
          <Pie
            data={data}
            labelLine={false}
            label={renderCustomizedLabel}
            fill="#8884d8"
            dataKey="num"
            isAnimationActive={isAnimationActive}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsDevtools />
        </PieChart>

        <div style={{display:"flex"}}>
          <LegendContent data={data}/>
        </div>
      </div>
    </div>
  );
}

const LegendContent = ({data}) => {
  return (
    <div style={{display: "flex", flexDirection: "column", justifyContent: "center",
                 marginRight: "20px", gap: "10px", boxSizing: "border-box"}}>
      {data.map((entry, index) => (
        <div id={index} style={{display: "flex", flexDirection: "row", alignItems: "center", gap: "5px"
        }}>
          <div style={{backgroundColor:COLORS[index], width:"10px", height:"10px", marginTop: "2px"}}>
          </div>

          <span>{entry.status === true ? <>True</> : <>False</>}</span>
        </div>
      
      ))}
    </div>
  )
}