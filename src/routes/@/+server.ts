import { redirect } from '@sveltejs/kit'

export function GET() {
	return redirect(302, '/add')
}
