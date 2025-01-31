import { Bar } from "react-chartjs-2";

export const ClassBarChart = ({ data, options, height = undefined, width = undefined }) => {
  return (
    <>
      {data && options && (
        <Bar
          data={data}
          options={options}
          height={height ? height : undefined}
          width={width ? width : undefined}
        />
      )}
    </>
  );
};
