ФАЗИ 0-5 ПІДСУМОК (для швидкого повторення)

0) TS toolchain
- commonjs, strict: true, esModuleInterop, moduleResolution: node
- npm run dev/build/start/typecheck

1) Типи
- src/types/index.ts - DTO'и, JwtPayload, рядки з БД
- src/types/express.d.ts - розширення Express.Request під req.user
- src/utils/HttpError.ts - клас з statusCode

2) config/db.ts
- єдиний query(text, params), pg.Pool
- dotenv як раніше
- SQL лише параметризований

3) models/*.ts
- дженерики під типи рядків
- SQL лише в моделях, $1,$2
- snake_case полів збережено

4) services/*.ts, authService.ts
- валідація в сервісах
- де доцільно - HttpError
- класи/функції збережено за оригіналом
- userModel.ts конвертований

5) controllers/*.ts, authController.ts
- authController - окремі функції, решта - клас зі static
- instanceof HttpError -> error.statusCode, else instanceof Error -> message, else загальне
- fallback: create/update* -> 400, getAll -> 500, getById -> 404
- req.params.id -> Number(req.params.id)
- req.user! там де гарантовано (authenticateToken)
- Request<Params,ResBody,ReqBody>, Response, Promise<void>, res.status().json() + return
- DTO з src/types
- відповідь { status: 'success'|'error', ... } без змін

ЩО ПЕРЕЧИТАТИ ПЕРЕД РОБОТОЮ З МІДЛВАРАМИ/РОУТАМИ/APP
- src/middlewares/authMiddleware.js - як формується req.user, коди 401/403
- src/middlewares/roleMiddleware.js - як працює authorizeRoles
- src/routes/*.js - порядок мідлварів, які публічні/захищені
- src/app.js - порядок middlewares, монтування /api/v1/*, GET /api/health, app.listen() НА ІМПОРТІ
- src/types/express.d.ts - JwtPayload
- src/utils/HttpError.ts - структура класу

ПРАВИЛА
- CommonJS
- SQL лише в моделях, параметризовано
- snake_case в JSON
- українські повідомлення
- GET /, /:id tournaments/teams/matches публічні
- GET /api/v1/applications вимагає токен
- Коміти Conventional Commits
