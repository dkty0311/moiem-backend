# Java 개발자를 위한 NestJS & Prisma 개발 매뉴얼

이 문서는 **Spring Boot (Java)** 환경에 익숙한 개발자가 이 프로젝트(NestJS + Prisma)를 이해하고, 앞으로 새로운 API를 쉽고 빠르게 개발할 수 있도록 개념을 매핑하고 실무 가이드를 제공합니다.

---

## 1. 아키텍처 비교 (Spring Boot vs NestJS)

NestJS는 Spring Boot의 구조와 지향점이 매우 유사합니다. 데코레이터(Decorator)와 의존성 주입(DI) 개념이 거의 1:1로 매핑됩니다.

| Spring Boot (Java) | NestJS (TypeScript) | 설명 |
| :--- | :--- | :--- |
| `Application.java` (main) | `src/main.ts` | 어플리케이션 진입점 및 포트 설정 |
| `@RestController` / `@RequestMapping` | `@Controller('path')` | 컨트롤러 정의 및 기본 라우트 경로 지정 |
| `@GetMapping`, `@PostMapping` | `@Get('path')`, `@Post('path')` | HTTP 메서드 및 매핑 |
| `@RequestBody` | `@Body()` | 요청(HTTP Request) 바디 매핑 |
| `@PathVariable` | `@Param('name')` | 경로 변수 매핑 |
| `@RequestParam` | `@Query('name')` | 쿼리 스트링 매핑 |
| `@Service` / `@Component` | `@Injectable()` | 스프링 빈(Bean)처럼 싱글톤으로 관리되는 서비스 클래스 |
| **Constructor Injection** (생성자 주입) | **Constructor Injection** | TypeScript의 `private readonly` 문법으로 생성자 자동 주입 |
| `@Autowired` | `@Inject()` | 주로 생성자 주입을 쓰고, 특수한 경우에만 사용함 |
| `@Valid` / `jakarta.validation` | `ValidationPipe` + `class-validator` | DTO 값 검증 (NotNull, Email 등) |
| Spring `@Configuration` / Component Scan | `@Module()` | 관련 컨트롤러, 서비스를 하나로 묶는 단위 (Nest는 **명시적 선언** 필수) |

---

## 2. 데이터베이스 레이어 비교 (JPA vs Prisma ORM)

이 프로젝트는 **Prisma ORM**을 사용하고 있습니다. JPA/Hibernate와 매우 흡사합니다.

| Spring Data JPA / Hibernate | Prisma ORM | 설명 |
| :--- | :--- | :--- |
| Entity 클래스 (`@Entity` 클래스) | `prisma/schema.prisma` | 하나의 스키마 파일에서 모든 DB 엔티티(모델) 및 관계 정의 |
| `EntityManager` / Repository 인터페이스 | `PrismaService` | DB 트랜잭션 및 쿼리 실행을 돕는 서비스 |
| `userRepository.findById(id)` | `this.prisma.user.findUnique({ where: { id } })` | CRUD 쿼리 호출 방식 |
| Flyway / Liquibase / `ddl-auto: update` | `npx prisma migrate dev` | DB 스키마 형상 관리 및 마이그레이션 생성 |

---

## 3. 새로운 API 개발 가이드 (Step-by-Step)

예시로 **모임(Moiem)에 대한 댓글(Comment) 추가 API**를 새로 만든다고 가정하고 절차를 설명합니다.

### Step 1: 데이터베이스 스키마 정의 (`schema.prisma`)
`prisma/schema.prisma` 파일의 가장 하단에 새로운 모델을 추가합니다.

```prisma
model Comment {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 관계 설정 (1:N)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  moiemId   String
  moiem     Moiem    @relation(fields: [moiemId], references: [id], onDelete: Cascade)
}
```
> **Note**
> `User`와 `Moiem` 모델에도 반대 방향의 관계(`comments Comment[]`) 필드를 추가해 주어야 양방향 참조가 활성화됩니다.

---

### Step 2: 로컬 DB에 마이그레이션 적용 및 Prisma Client 생성
수정한 스키마를 로컬 DB에 빌드하고, TypeScript 코드에서 참조할 타입(Prisma Client)을 자동 생성합니다.

```bash
# 로컬 개발 환경 터미널에서 실행
npx prisma migrate dev --name add_comment_model
```
* 이 명령어를 실행하면 `prisma/migrations/` 폴더 아래에 SQL 마이그레이션 파일이 생기고, 자동으로 DB에 반영되며, `@prisma/client` 내부 타입들이 업데이트됩니다.

---

### Step 3: NestJS 파일 생성 (CLI 활용)
NestJS CLI를 통해 보일러플레이트 코드를 자동으로 생성합니다.

```bash
# 1. Module 생성 (가장 먼저 만듭니다)
npx nest g module comments

# 2. Service 생성
npx nest g service comments --no-spec

# 3. Controller 생성
npx nest g controller comments --no-spec
```
> **Tip**
> `--no-spec` 옵션을 붙이면 테스트용 `.spec.ts` 파일을 생성하지 않습니다.

---

### Step 4: DTO 클래스 작성
요청값 검증과 Swagger 문서화를 위해 DTO(Data Transfer Object)를 작성합니다. 스프링의 DTO와 `@Valid` 애노테이션 작성 방식과 일치합니다.

`src/comments/dto/create-comment.dto.ts` 파일을 신규 생성합니다.

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: '좋은 모임이네요! 꼭 참석하겠습니다.', description: '댓글 내용' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  content: string;
}
```

---

### Step 5: Service에 비즈니스 로직 작성
`PrismaService`를 의존성 주입받아 DB CRUD 코드를 구현합니다.

`src/comments/comments.service.ts` 파일을 수정합니다.

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  // 생성자 주입 (Spring Boot의 @RequiredArgsConstructor 방식과 동일)
  constructor(private readonly prisma: PrismaService) {}

  async createComment(userId: string, moiemId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        userId: userId,
        moiemId: moiemId,
      },
      // 조인(Join)하여 연관 관계 데이터를 함께 반환하고 싶을 때 select/include 사용
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getCommentsByMoiem(moiemId: string) {
    return this.prisma.comment.findMany({
      where: { moiemId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

---

### Step 6: Controller 구현 및 엔드포인트 노출
HTTP 요청을 받아 서비스를 호출하고 응답을 반환합니다.

`src/comments/comments.controller.ts` 파일을 수정합니다.

```typescript
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('comments') // Swagger 그룹화 태그
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':moiemId')
  @ApiBearerAuth() // Swagger 자물쇠 표시 (JWT 인증 필요)
  @ApiOperation({ summary: '댓글 작성' })
  async create(
    @Param('moiemId') moiemId: string,
    @CurrentUser() user: JwtPayload, // 커스텀 데코레이터로 로그인 유저 토큰 정보 파싱
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(user.sub, moiemId, dto);
  }

  @Get(':moiemId')
  @ApiOperation({ summary: '특정 모임의 댓글 목록 조회' })
  async findAll(@Param('moiemId') moiemId: string) {
    return this.commentsService.getCommentsByMoiem(moiemId);
  }
}
```

---

### Step 7: Module 파일 설정 확인
NestJS는 빈(Bean) 등록 범위와 내보내기를 명시해 주어야 합니다. CLI가 모듈 등록을 자동으로 처리해 주었겠지만, `PrismaService`를 사용하기 위해 `PrismaModule`을 임포트해 주어야 합니다.

`src/comments/comments.module.ts` 파일을 수정합니다.

```typescript
import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaModule } from '../prisma/prisma.module'; // PrismaModule 임포트 필요

@Module({
  imports: [PrismaModule], // 다른 모듈의 빈을 사용할 때 imports 배열에 추가
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
```

---

### Step 8: 동작 확인
로컬에서 프로젝트를 구동하고 스웨거에서 API가 올바르게 작동하는지 확인합니다.

```bash
npm run start:dev
```
👉 접속 주소: **http://localhost:3000/api**
