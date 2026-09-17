import Link from 'next/link';
import { CadastroForm } from './cadastro-form';

export const metadata = { title: 'Criar conta — Gamifica E-commerce' };

export default function CadastroPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Crie sua conta</h1>
      <p className="mt-1 text-sm text-slate-500">
        Comece a gamificar sua loja e capturar mais leads em poucos minutos.
      </p>

      <CadastroForm />

      <p className="mt-6 text-center text-sm text-slate-500">
        Já tem uma conta?{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Entrar
        </Link>
      </p>
    </div>
  );
}
