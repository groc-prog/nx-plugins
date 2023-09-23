"""
Entry point for gRPC application.
"""
import asyncio
import concurrent.futures as futures
import logging

import grpc

# from grpc_reflection.v1alpha import reflection


async def serve() -> None:
    """
    Starts the gRPC server on the defined port.
    """

    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))

    # Replace <your-service> with your actual service definition below
    # SERVICE_NAMES = (
    #     <your-service>.DESCRIPTOR.services_by_name["<service-name>"].full_name,
    #     reflection.SERVICE_NAME,
    # )
    # reflection.enable_server_reflection(SERVICE_NAMES, server)
    # add_<your-service>_to_server(<your-service>(), server)

    server.add_insecure_port("<%= port %>")
    await server.start()
    logging.info("gRPC server started on %s", "<%= port %>")
    await server.wait_for_termination()


if __name__ == "__main__":
    logging.info("Starting gRPC server")
    asyncio.run(serve())
