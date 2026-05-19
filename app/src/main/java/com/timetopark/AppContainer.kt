package com.timetopark

import com.timetopark.data.remote.FakeRepository

object AppContainer {
    val repository = FakeRepository()
}
