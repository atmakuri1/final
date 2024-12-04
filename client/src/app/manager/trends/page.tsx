"use client";

import React, { useState, useEffect } from 'react';
import {
  Container,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define the type of the response data structure
interface SalesData {
  day: string;
  net_sales_profit: string;
  total_sales: string;
}

interface ReportData {
  hour?: number;
  item_name?: string;
  total_sales: number;
}

interface ApiResponse {
  salesData: SalesData[];
  lastGenerated: string | null;
  currentTime: string | null;
}
interface ProductUsage {
  name: string; // Inventory item name
  usageCount: number; // Number of times the item was used
  totalPrice: number; // Total price amount
}


const Trends: React.FC = () => {
  const [lineChartData, setLineChartData] = useState<any>(null); // First chart data
  const [barChartData, setBarChartData] = useState<any>(null); // Second chart data
  const [tableData, setTableData] = useState<ReportData[]>([]); // Data for second table
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [stopDate, setStopDate] = useState<string>('');
  const [productUsageData, setProductUsageData] = useState<
  { name: string; usageCount: number; totalPrice: number }[]
>([]);




  // Fetch data for the first chart (default past year)
  const fetchTrendsData = async () => {
    try {
      const response = await axios.get<ApiResponse>('/api/trends', {
        params: { startDate, endDate: stopDate },
      });
      const { salesData } = response.data;
  
      const dailyData = salesData.map((data) => ({
        day: data.day,
        net_sales_profit: parseFloat(data.net_sales_profit),
        total_sales: parseInt(data.total_sales),
      }));
  
      const lineData = {
        labels: dailyData.map((data) => data.day), // Use daily dates for data points
        datasets: [
          {
            label: 'Net Sales Profit',
            data: dailyData.map((data) => data.net_sales_profit),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.3,
          },
          {
            label: 'Total Number of Sales',
            data: dailyData.map((data) => data.total_sales),
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            tension: 0.3,
          },
        ],
      };
  
      setLineChartData(lineData);
    } catch (error) {
      console.error('Failed to fetch trends data:', error);
    }
  };
  
  
  

  // Fetch data for the second table and chart (X Report by default)
  const fetchReportData = async (reportType: 'x' | 'z') => {
    try {
      const response = await axios.get<ApiResponse>('/api/report', {
        params: { reportType },
      });

      const { salesData, lastGenerated, currentTime } = response.data;

      if (salesData) {
        if (reportType === 'x') {
          const barData = {
            labels: salesData.map((data: any) => `${data.hour}:00`),
            datasets: [
              {
                label: 'Total Sales Amount ($)',
                data: salesData.map((data: any) => parseFloat(data.total_sales)),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          };

          setBarChartData(barData);
          setTableData(
            salesData.map((data: any) => ({
              hour: data.hour,
              total_sales: parseFloat(data.total_sales),
            }))
          );
        } else if (reportType === 'z') {
          const barData = {
            labels: salesData.map((data: any) => data.item_name),
            datasets: [
              {
                label: 'Total Sales Amount ($)',
                data: salesData.map((data: any) => parseFloat(data.total_sales)),
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
              },
            ],
          };

          setBarChartData(barData);
          setTableData(
            salesData.map((data: any) => ({
              item_name: data.item_name,
              total_sales: parseFloat(data.total_sales),
            }))
          );
        }
      } else {
        setTableData([]);
      }

      setLastGenerated(lastGenerated);
      setCurrentTime(currentTime);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    }
  };

  const fetchProductUsageData = async () => {
    try {
      const response = await axios.get<ProductUsage[]>('/api/product-usage', {
        params: { startDate, endDate: stopDate }, // Pass date range to the API
      });
      console.log('Product Usage Data:', response.data);
      setProductUsageData(response.data); // Update table data
    } catch (error) {
      console.error('Failed to fetch product usage data:', error);
    }
  };
  
  
  

  // Load data for both sections when the page loads
  useEffect(() => {
    fetchTrendsData();
    fetchReportData('x'); // Default to X Report data
    fetchProductUsageData(); // Fetch product usage data

  }, []);
  

  return (
    <Container style={{ width: '98%' }}>
      <Typography variant="h4" style={{ paddingBottom: '16px' }}>
        Trends
      </Typography>

      {/* First Graph Section */}
      <div style={{ display: 'flex', gap: '16px', paddingBottom: '16px', justifyContent: 'left' }}>
      <TextField
        label="Start Date"
        type="date"
        InputLabelProps={{ shrink: true }}
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)} // Update startDate
        />
      <TextField
        label="Stop Date"
        type="date"
        InputLabelProps={{ shrink: true }}
        value={stopDate}
        onChange={(e) => setStopDate(e.target.value)} // Update stopDate
      />
        <Button variant="contained" color="success" onClick={fetchTrendsData}>
          Search
        </Button>
      </div>
      <div
        style={{
          height: '400px',
          position: 'relative',
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto',
        }}
      >
        {lineChartData ? (
          <Line data={lineChartData} />
        ) : (
          <Typography variant="h6" style={{ textAlign: 'center', marginTop: '50px' }}>
            No data available. Please adjust the date range.
          </Typography>
        )}
      </div>

      {/* Sales Reports Section */}
      <Typography variant="h4" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
        Sales Reports
      </Typography>
      <div style={{ display: 'flex', gap: '16px', paddingBottom: '16px', justifyContent: 'left' }}>
        <Button variant="contained" color="primary" onClick={() => fetchReportData('x')}>
          X Report
        </Button>
        <Button variant="contained" color="primary" onClick={() => fetchReportData('z')}>
          Z Report
        </Button>
      </div>
      <div
        style={{
          height: '400px',
          position: 'relative',
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto',
        }}
      >
        {barChartData ? (
          <Bar data={barChartData} />
        ) : (
          <Typography variant="h6" style={{ textAlign: 'center', marginTop: '50px' }}>
            No data available for items. Please adjust the date range or run a report.
          </Typography>
        )}
      </div>

      {/* Sales Details Table */}
      <Typography variant="h4" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
        Sales Details
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{tableData[0]?.item_name ? 'Item Name' : 'Hour'}</TableCell>
              <TableCell>Total Sales Amount ($)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.length > 0 ? (
              tableData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {row.item_name || `${row.hour}:00`}
                  </TableCell>
                  <TableCell>
                    {row.total_sales.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  No data available for the selected range.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {lastGenerated && currentTime && (
        <Typography variant="body2" style={{ marginTop: '16px', textAlign: 'center' }}>
          Showing data from {new Date(lastGenerated).toLocaleString()} to {new Date(currentTime).toLocaleString()}
        </Typography>
      )}
      {/* Product Usage Section */}
<Typography variant="h4" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
  Product Usage and Sales
</Typography>

{/* Time Range and Search Button */}
<div style={{ display: 'flex', gap: '16px', paddingBottom: '16px', justifyContent: 'left' }}>
  <TextField
    label="Start Date"
    type="date"
    InputLabelProps={{ shrink: true }}
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)} // Update startDate for Product Usage
  />
  <TextField
    label="Stop Date"
    type="date"
    InputLabelProps={{ shrink: true }}
    value={stopDate}
    onChange={(e) => setStopDate(e.target.value)} // Update stopDate for Product Usage
  />
  <Button variant="contained" color="primary" onClick={fetchProductUsageData}>
    Search
  </Button>
</div>

{/* Display message or table */}
{!startDate || !stopDate ? (
  <Typography variant="h6" style={{ textAlign: 'center', marginTop: '16px' }}>
    Please enter a time range.
  </Typography>
) : (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Item</TableCell>
          <TableCell>Amount</TableCell>
          <TableCell>Total Price ($)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {productUsageData.length > 0 ? (
          productUsageData.map((product, index) => (
            <TableRow key={index}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.usageCount}</TableCell>
              <TableCell>{product.totalPrice.toFixed(2)}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={2} align="center">
              No data available for the selected range.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>
)}


    </Container>
  );
};

export default Trends;
