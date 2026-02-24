# POI repository: read (and later write) POIs from the database.
# Uses database.get_session() for each operation. Used by normalizer and seed script.

from app.data_layer.database import get_session
from app.data_layer.models import POI


def get_all_pois():
    """
    Return all POIs from the database, in no guaranteed order.
    Used by the normalizer to fetch the full candidate set before filtering.
    Returns: list of POI model instances.
    """
    with get_session() as session:
        return session.query(POI).all()


def get_poi_by_id(poi_id: int):
    """
    Return a single POI by id, or None if not found.
    Useful for lookups when we have an id from an itinerary (e.g. after GA).
    """
    with get_session() as session:
        return session.query(POI).filter(POI.id == poi_id).first()
