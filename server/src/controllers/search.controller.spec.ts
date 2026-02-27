import { SearchController } from 'src/controllers/search.controller';
import { SearchService } from 'src/services/search.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(SearchController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(SearchService);

  beforeAll(async () => {
    ctx = await controllerSetup(SearchController, [{ provide: SearchService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /search/metadata', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/search/metadata');
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should reject page as a string', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/search/metadata').send({ page: 'abc' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[page] Invalid input: expected number, received string']));
    });

    it('should reject page as a negative number', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/search/metadata').send({ page: -10 });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[page] Too small: expected number to be >=1']));
    });

    it('should reject page as 0', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/search/metadata').send({ page: 0 });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[page] Too small: expected number to be >=1']));
    });

    it('should reject size as a string', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/search/metadata').send({ size: 'abc' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[size] Invalid input: expected number, received string']));
    });

    it('should reject an invalid size', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/search/metadata').send({ size: -1.5 });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[size] Too small: expected number to be >=1']));
    });

    it('should reject an visibility as not an enum', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/search/metadata')
        .send({ visibility: 'immich' });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest([expect.stringContaining('[visibility] Invalid option: expected one of')]),
      );
    });

    it('should reject an isFavorite as not a boolean', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/search/metadata')
        .send({ isFavorite: 'immich' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[isFavorite] Invalid input: expected boolean, received string']));
    });

    it('should reject an isEncoded as not a boolean', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/search/metadata')
        .send({ isEncoded: 'immich' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[isEncoded] Invalid input: expected boolean, received string']));
    });

    it('should reject an isOffline as not a boolean', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/search/metadata')
        .send({ isOffline: 'immich' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[isOffline] Invalid input: expected boolean, received string']));
    });

    it('should reject an isMotion as not a boolean', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/search/metadata').send({ isMotion: 'immich' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[isMotion] Invalid input: expected boolean, received string']));
    });

    describe('POST /search/random', () => {
      it('should be an authenticated route', async () => {
        await request(ctx.getHttpServer()).post('/search/random');
        expect(ctx.authenticate).toHaveBeenCalled();
      });

      it('should reject if withStacked is not a boolean', async () => {
        const { status, body } = await request(ctx.getHttpServer())
          .post('/search/random')
          .send({ withStacked: 'immich' });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(['[withStacked] Invalid input: expected boolean, received string']));
      });

      it('should reject if withPeople is not a boolean', async () => {
        const { status, body } = await request(ctx.getHttpServer())
          .post('/search/random')
          .send({ withPeople: 'immich' });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(['[withPeople] Invalid input: expected boolean, received string']));
      });
    });

    describe('POST /search/smart', () => {
      it('should be an authenticated route', async () => {
        await request(ctx.getHttpServer()).post('/search/smart');
        expect(ctx.authenticate).toHaveBeenCalled();
      });
    });

    describe('GET /search/explore', () => {
      it('should be an authenticated route', async () => {
        await request(ctx.getHttpServer()).get('/search/explore');
        expect(ctx.authenticate).toHaveBeenCalled();
      });
    });

    describe('POST /search/person', () => {
      it('should be an authenticated route', async () => {
        await request(ctx.getHttpServer()).get('/search/person');
        expect(ctx.authenticate).toHaveBeenCalled();
      });

      it('should require a name', async () => {
        const { status, body } = await request(ctx.getHttpServer()).get('/search/person').send({});
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(['[name] Invalid input: expected string, received undefined']));
      });
    });

    describe('GET /search/places', () => {
      it('should be an authenticated route', async () => {
        await request(ctx.getHttpServer()).get('/search/places');
        expect(ctx.authenticate).toHaveBeenCalled();
      });

      it('should require a name', async () => {
        const { status, body } = await request(ctx.getHttpServer()).get('/search/places').send({});
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(['[name] Invalid input: expected string, received undefined']));
      });
    });

    describe('GET /search/cities', () => {
      it('should be an authenticated route', async () => {
        await request(ctx.getHttpServer()).get('/search/cities');
        expect(ctx.authenticate).toHaveBeenCalled();
      });
    });

    describe('GET /search/suggestions', () => {
      it('should be an authenticated route', async () => {
        await request(ctx.getHttpServer()).get('/search/suggestions');
        expect(ctx.authenticate).toHaveBeenCalled();
      });

      it('should require a type', async () => {
        const { status, body } = await request(ctx.getHttpServer()).get('/search/suggestions').send({});
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest([expect.stringContaining('[type] Invalid option: expected one of')]));
      });
    });
  });
});
