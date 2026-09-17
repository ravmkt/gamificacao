import Link from 'next/link';
import { LoginForm } from './login-form';

export const metadata = { title: 'Entrar — Gamifica E-commerce' };

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Entrar</h1>
      <p className="mt-1 text-sm text-slate-500">Acesse o painel da sua loja.</p>

      <LoginForm />

      <div className="mt-4 text-center">
        <Link
          href="/recuperar-senha"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Esqueci minha senha
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Ainda não tem uma conta?{' '}
        <Link href="/cadastro" className="font-medium text-indigo-600 hover:text-indigo-500">
          Criar conta gratuita
        </Link>
      </p>
    </div>
  );
}
