# POI repository: read (and later write) POIs from the database.
# Uses database.get_session() for each operation. Used by normalizer and seed script.

from sqlalchemy.orm import make_transient

from app.data_layer.database import get_session
from app.data_layer.models import POI


def get_all_pois():
    """
    Return all POIs from the database, in no guaranteed order.
    Used by the normalizer to fetch the full candidate set before filtering.
    Returns: list of POI model instances (detached from session).
    """
    with get_session() as session:
        pois = session.query(POI).all()
        # Detach from session so attributes are accessible after session closes
        for poi in pois:
            session.expunge(poi)
            make_transient(poi)
        return pois


def get_poi_by_id(poi_id: int):
    """
    Return a single POI by id, or None if not found.
    Useful for lookups when we have an id from an itinerary (e.g. after GA).
    """
    with get_session() as session:
        poi = session.query(POI).filter(POI.id == poi_id).first()
        if poi:
            session.expunge(poi)
            make_transient(poi)
        return poi
