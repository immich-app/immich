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
      expect(body).toEqual(errorDto.badRequest(['page must not be less than 1', 'page must be an integer number']));
    });

    it('should reject page as a negative number', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/search/metadata').send({ page: -10 });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['page must not be less than 1']));
    });

    it('should reject page as 0', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/search/metadata').send({ page: 0 });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['page must not be less than 1']));
    });

    it('should reject size as a string', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/search/metadata').send({ size: 'abc' });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest([
          'size must not be greater than 1000',
          'size must not be less than 1',
          'size must be an integer number',
        ]),
      );
    });

    it('should reject an invalid size', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/search/metadata').send({ size: -1.5 });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['size must not be less than 1', 'size must be an integer number']));
    });

    it('should reject an visibility as not an enum', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/search/metadata')
        .send({ visibility: 'immich' });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest(['visibility must be one of the following values: archive, timeline, hidden, locked']),
      );
    });

    it('should reject an isFavorite as not a boolean', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/search/metadata')
        .send({ isFavorite: 'immich' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['isFavorite must be a boolean value']));
    });

    it('should reject an isEncoded as not a boolean', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/search/metadata')
        .send({ isEncoded: 'immich' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['isEncoded must be a boolean value']));
    });

    it('should reject an isOffline as not a boolean', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/search/metadata')
        .send({ isOffline: 'immich' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['isOffline must be a boolean value']));
    });

    it('should reject an isMotion as not a boolean', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/search/metadata').send({ isMotion: 'immich' });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['isMotion must be a boolean value']));
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
        expect(body).toEqual(errorDto.badRequest(['withStacked must be a boolean value']));
      });

      it('should reject if withPeople is not a boolean', async () => {
        const { status, body } = await request(ctx.getHttpServer())
          .post('/search/random')
          .send({ withPeople: 'immich' });
        expect(status).toBe(400);
        expect(body).toEqual(errorDto.badRequest(['withPeople must be a boolean value']));
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
        expect(body).toEqual(errorDto.badRequest(['name should not be empty', 'name must be a string']));
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
        expect(body).toEqual(errorDto.badRequest(['name should not be empty', 'name must be a string']));
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
        expect(body).toEqual(
          errorDto.badRequest([
            'type should not be empty',
            expect.stringContaining('type must be one of the following values:'),
          ]),
        );
      });
    });
  });
});
