import Link from 'next/link';
import { RecuperarSenhaForm } from './recuperar-senha-form';

export const metadata = { title: 'Recuperar senha — Gamifica E-commerce' };

export default function RecuperarSenhaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Recuperar senha</h1>
      <p className="mt-1 text-sm text-slate-500">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      <RecuperarSenhaForm />

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
