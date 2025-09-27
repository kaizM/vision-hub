import { PinLogin } from '../PinLogin';

export default function PinLoginExample() {
  const handleLogin = (pin: string, employeeName: string, role: string) => {
    console.log(`Login: ${employeeName} (${role}) with PIN ${pin}`);
  };

  return <PinLogin onLogin={handleLogin} />;
}