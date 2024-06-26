from app.schemas import ModelSession


def has_batch_axis(session: ModelSession) -> bool:
    return not isinstance(session.get_inputs()[0].shape[0], int) or session.get_inputs()[0].shape[0] < 0
