import React from 'react';

interface StatusMessageProps {
  message: string;
  isError: boolean;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, isError }) => {
  if (!message) return null;

  return (
    <div
      className={`p-4 mb-4 rounded-md text-sm ${
        isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
      }`}
    >
      {message}
    </div>
  );
};

export default StatusMessage;