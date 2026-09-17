import { RedefinirSenhaForm } from './redefinir-senha-form';

export const metadata = { title: 'Redefinir senha — Gamifica E-commerce' };

export default function RedefinirSenhaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Defina sua nova senha</h1>
      <p className="mt-1 text-sm text-slate-500">
        Escolha uma senha forte com pelo menos 8 caracteres.
      </p>

      <RedefinirSenhaForm />
    </div>
  );
}
