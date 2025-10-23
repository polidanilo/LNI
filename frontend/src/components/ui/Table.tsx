import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> & {
  Header: React.FC<TableHeaderProps>;
  Body: React.FC<TableBodyProps>;
  Row: React.FC<TableRowProps>;
  Head: React.FC<TableHeadProps>;
  Cell: React.FC<TableCellProps>;
} = ({ children, className = '' }) => (
  <div className="overflow-x-auto">
    <table className={`w-full ${className}`}>
      {children}
    </table>
  </div>
);

const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '' }) => (
  <thead className={`bg-gray-50 border-b border-gray-200 ${className}`}>
    {children}
  </thead>
);

const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-gray-200 ${className}`}>
    {children}
  </tbody>
);

const TableRow: React.FC<TableRowProps> = ({ children, className = '', onClick }) => (
  <tr 
    className={`hover:bg-gray-50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </tr>
);

const TableHead: React.FC<TableHeadProps> = ({ 
  children, 
  className = '', 
  sortable = false, 
  sortDirection = null,
  onSort 
}) => (
  <th 
    className={`px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider ${
      sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
    } ${className}`}
    onClick={sortable ? onSort : undefined}
  >
    <div className="flex items-center space-x-1">
      <span>{children}</span>
      {sortable && (
        <div className="flex flex-col ml-1">
          <svg 
            className={`w-2 h-2 ${sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <svg 
            className={`w-2 h-2 ${sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  </th>
);

const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => (
  <td className={`px-6 py-3 text-sm text-gray-900 ${className}`}>
    {children}
  </td>
);

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;

export default Table;
