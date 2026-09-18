import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware que mantém a sessão do Supabase Auth sempre atualizada
 * (refresh de token) em cada requisição, e redireciona para /login
 * usuários não autenticados tentando acessar rotas protegidas do painel.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const rotasProtegidas = ['/painel'];
  const isRotaProtegida = rotasProtegidas.some((p) => request.nextUrl.pathname.startsWith(p));

  if (isRotaProtegida && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const rotasSomenteDeslogado = ['/login', '/cadastro'];
  const isRotaSomenteDeslogado = rotasSomenteDeslogado.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isRotaSomenteDeslogado && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/painel';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Aplica a todas as rotas exceto arquivos estáticos, imagens e a API
     * pública /v1/* (que usa autenticação por chave de API, não sessão).
     */
    '/((?!_next/static|_next/image|favicon.ico|v1/|api/widget|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js)$).*)',
  ],
};
