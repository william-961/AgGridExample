import "ag-grid-community/styles/ag-grid.min.css"; 
import "ag-grid-community/styles/ag-theme-material.css";  
 
import { AgGridReact, AgGridReactProps } from "ag-grid-react"; 
import {
  forwardRef,
  ForwardedRef, 
} from "react";
 
 
export interface IDataGridProps extends AgGridReactProps {
 
 
}

export const DataGrid = forwardRef(
  (
    { ...props }: IDataGridProps,
    ref: ForwardedRef<AgGridReact>,
  ) => {
     
    return (
      <div 
        className={`ag-theme-material`} 
        style={{height: "35vh"}}
      >
        <AgGridReact
          ref={ref} 
          rowSelection="multiple"       
          {...props}    
        />
      </div>
    );
  },
);

 