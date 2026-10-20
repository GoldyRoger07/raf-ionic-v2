import { environment } from '../../environments/environment';

/** URL complete d'un endpoint de l'API (apiUrl vide = meme origine). */
export function api(path: string): string {
  return environment.apiUrl.replace(/\/$/, '') + '/api' + path;
}
