"""
Connector Registry.

Add a new backup platform by writing a class that implements BaseConnector
and adding one line here. Nothing else in the app needs to change —
normalization, DB, rules engine, and API all iterate over this registry.
"""
from .rubrik import RubrikConnector
from .veeam import VeeamConnector
from .commvault import CommvaultConnector
from .azure_backup import AzureBackupConnector

CONNECTOR_REGISTRY = {
    "rubrik": {"cls": RubrikConnector, "display_name": "Rubrik Security Cloud"},
    "veeam": {"cls": VeeamConnector, "display_name": "Veeam Backup & Replication"},
    "commvault": {"cls": CommvaultConnector, "display_name": "Commvault"},
    "azure_backup": {"cls": AzureBackupConnector, "display_name": "Microsoft Azure Backup"},
    # "cohesity": {"cls": CohesityConnector, "display_name": "Cohesity DataProtect"},  <- example future add
}


def get_connector_instance(vendor_key: str):
    entry = CONNECTOR_REGISTRY[vendor_key]
    return entry["cls"]()


def all_connectors():
    return {k: get_connector_instance(k) for k in CONNECTOR_REGISTRY}
