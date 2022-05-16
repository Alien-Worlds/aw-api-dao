
const { ScanCoordinator } = require("./block-scan-node")

const tester = async () => {
    const coordinator = await ScanCoordinator()

    const scan_key = "mykey"

    await coordinator.deleteAll(scan_key)
    console.log("deleted all")


    // Creates a new scan tree from block 1 up to 730 with a unique key of "scan_key" to support different scan events. \
    // The tree will subdivided recursively with 4 children in each branch until there is a max of 32 blocks in each leaf node.
    await coordinator.init_scan(1, 730, scan_key, 4, 32)

    const leafCount = await coordinator.get_number_leaf_nodes(scan_key)
    console.log("count", leafCount)

    // Should delete 1st range parent
    await coordinator.update_current_block_progress(12, scan_key)
    await coordinator.update_current_block_progress(24, scan_key)
    await coordinator.update_current_block_progress(36, scan_key)
    await coordinator.update_current_block_progress(46, scan_key)

    // Should delete 2nd range parent
    await coordinator.update_current_block_progress(58, scan_key)
    await coordinator.update_current_block_progress(70, scan_key)
    await coordinator.update_current_block_progress(82, scan_key)
    await coordinator.update_current_block_progress(92, scan_key)

    //should delete 3rd range parent
    await coordinator.update_current_block_progress(102, scan_key) // should update but not delete anything
    await coordinator.update_current_block_progress(104, scan_key)
    // await coordinator.update_current_block_progress(104, scan_key) // should fail

    await coordinator.update_current_block_progress(116, scan_key)
    await coordinator.update_current_block_progress(128, scan_key)
    await coordinator.update_current_block_progress(138, scan_key)

    // should delete 4th range parent and the parent above
    await coordinator.update_current_block_progress(150, scan_key)
    await coordinator.update_current_block_progress(162, scan_key)
    await coordinator.update_current_block_progress(174, scan_key)
    await coordinator.update_current_block_progress(183, scan_key)

    console.log("done updating and deleting first branch")

    var nextRange = await coordinator.start_next_range(scan_key)
    console.log("next:", JSON.stringify(nextRange.data(), null, 2))

    nextRange = await coordinator.start_next_range(scan_key)
    console.log("next:", JSON.stringify(nextRange.data(), null, 2))

    nextRange = await coordinator.start_next_range(scan_key)
    console.log("next:", JSON.stringify(nextRange.data(), null, 2))

    await nextRange.set_current_block_progress(45)
    console.log("next:", JSON.stringify(nextRange.data(), null, 2))

    process.exit(0)
}

tester()