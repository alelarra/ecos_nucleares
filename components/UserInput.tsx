
import React, { useState } from 'react';

interface UserInputProps {
  onSubmit: (command: string) => void;
  disabled: boolean;
}

const UserInput: React.FC<UserInputProps> = ({ onSubmit, disabled }) => {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !disabled) {
      onSubmit(command.trim());
      setCommand('');
    }
  };

  return (
    <div className="p-4 border-t-2 border-green-500 bg-black/50">
      <form onSubmit={handleSubmit} className="flex items-center">
        <span className="text-green-400 text-2xl md:text-3xl mr-3">&gt;</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          disabled={disabled}
          className="w-full bg-transparent text-green-300 text-xl md:text-2xl focus:outline-none placeholder-gray-600"
          placeholder={disabled ? 'Esperando respuesta...' : 'Escribe tu comando aquí...'}
          autoFocus
        />
      </form>
    </div>
  );
};

export default UserInput;
